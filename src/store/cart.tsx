import { createContext, useContext, useEffect, useReducer, useState, ReactNode } from "react";

export type CartItem = {
  id: string; // unique identifier
  menuOptionId: string;
  day: string;
  name: string;
  items: string;
  price: number;
  quantity: number;
  imageSrc?: string;
};

export type CartState = {
  items: CartItem[];
  plan: "single" | "weekly" | "monthly" | "corporate" | null;
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "id"> & { id?: string } }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_PLAN"; payload: "single" | "weekly" | "monthly" | "corporate" }
  | { type: "HYDRATE_CART"; payload: CartState }
  | { type: "CLEAR_CART" };

const CART_STORAGE_KEY = "ghar-se-daftar-cart";

const initialState: CartState = {
  items: [],
  plan: null,
};

function isCartState(value: unknown): value is CartState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CartState>;
  const validPlan =
    candidate.plan === null ||
    candidate.plan === "single" ||
    candidate.plan === "weekly" ||
    candidate.plan === "monthly" ||
    candidate.plan === "corporate";

  return Boolean(
    validPlan &&
      Array.isArray(candidate.items) &&
      candidate.items.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.menuOptionId === "string" &&
          typeof item.day === "string" &&
          typeof item.name === "string" &&
          typeof item.items === "string" &&
          typeof item.price === "number" &&
          Number.isFinite(item.price) &&
          typeof item.quantity === "number" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      )
  );
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const id = action.payload.id || `${action.payload.menuOptionId}-${Date.now()}`;
      const existingItem = state.items.find(
        (item) => item.menuOptionId === action.payload.menuOptionId && item.day === action.payload.day
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            ...action.payload,
            id,
            quantity: action.payload.quantity || 1,
          },
        ],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.max(1, action.payload.quantity) }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "SET_PLAN":
      return {
        ...state,
        plan: action.payload,
      };

    case "HYDRATE_CART":
      return action.payload;

    case "CLEAR_CART":
      return {
        items: [],
        plan: null,
      };

    default:
      return state;
  }
}

type CartContextType = {
  state: CartState;
  dispatch: (action: CartAction) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart);
        if (isCartState(parsedCart)) {
          dispatch({ type: "HYDRATE_CART", payload: parsedCart });
        } else {
          window.localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Unable to restore cart:", error);
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [hydrated, state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
