import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import CustomError from "../errors/CustomError";
import { api } from "../services/api";
import { Product, Stock } from "../types";

type ProductResponse = Omit<Product, "amount">;

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockProduct } = await api.get<Stock>(`stock/${productId}`);
      const indexProduct = cart.findIndex(
        (product) => product.id === productId
      );

      if (indexProduct >= 0) {
        if (stockProduct.amount >= cart[indexProduct].amount + 1) {
          const newCart = [...cart];
          newCart[indexProduct].amount = cart[indexProduct].amount + 1;

          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        } else {
          throw new CustomError({
            message: "Quantidade solicitada fora de estoque",
            statusCode: 10,
          });
        }
      } else {
        if (stockProduct.amount >= 1) {
          const { data: product } = await api.get<ProductResponse>(
            `products/${productId}`
          );

          setCart([...cart, { ...product, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...product, amount: 1 }])
          );
        }
      }
    } catch (e: any) {
      if (e instanceof CustomError) {
        toast.error(e.message);
      } else {
        toast.error("Erro na adição do produto");
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex < 0) {
        throw Error();
      }

      const newCart = [...cart];

      newCart.splice(productIndex, 1);

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data: stockProduct } = await api.get<Stock>(`stock/${productId}`);

      if (amount > stockProduct.amount) {
        throw new CustomError({
          message: "Quantidade solicitada fora de estoque",
          statusCode: 10,
        });
      }

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex < 0) {
        throw Error();
      }

      const newCart = [...cart];
      newCart[productIndex].amount = amount;

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch (e: any) {
      if (e instanceof CustomError) {
        toast.error(e.message);
      } else {
        toast.error("Erro na alteração de quantidade do produto");
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
