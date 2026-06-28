import { createContext, useContext, useReducer, ReactNode } from "react";

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
  plan: "single" | "weekly" | "monthly" | null;
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "id"> & { id?: string } }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_PLAN"; payload: "single" | "weekly" | "monthly" }
  | { type: "CLEAR_CART" };

const initialState: CartState = {
  items: [],
  plan: null,
};

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
