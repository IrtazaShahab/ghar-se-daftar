import { foodImages } from "./food-images";

export type MenuOption = {
  name: string;
  items: string;
  tags: string[];
  imageSrc?: string;
  price?: number;
};

export type DayMenu = {
  day: string;
  optionA: MenuOption;
  optionB: MenuOption;
  isAddon?: boolean;
};

export const weeklyMenu: DayMenu[] = [
  {
    day: "Monday",
    optionA: { name: "Chicken Achari", items: "2 Roti + Salad", tags: ["Rich", "Classic"], imageSrc: foodImages.chickenAchari, price: 350 },
    optionB: { name: "Daal Chawal", items: "Kachumber Salad", tags: ["Light", "Comfort"], imageSrc: foodImages.daalChawal, price: 350 }
  },
  {
    day: "Tuesday",
    optionA: { name: "Daal Mash", items: "2 Roti + Mint Raita", tags: ["Protein", "Homestyle"], imageSrc: foodImages.daalChawal, price: 350 },
    optionB: { name: "Kabab Pulao", items: "Mint Raita + Salad", tags: ["Office Favorite", "Rice"], imageSrc: foodImages.chickenBiryani, price: 350 }
  },
  {
    day: "Wednesday",
    optionA: { name: "Seasonal Sabzi", items: "2 Roti + Salad", tags: ["Vegetarian", "Balanced"], imageSrc: foodImages.homeKitchenSpread, price: 350 },
    optionB: { name: "Haleem", items: "Naan/Roti + Salad", tags: ["Hearty", "Traditional"], imageSrc: foodImages.haleem, price: 350 }
  },
  {
    day: "Thursday",
    optionA: { name: "Kadhi Chawal", items: "Fresh Salad", tags: ["Comfort", "Rice"], imageSrc: foodImages.kariChawal, price: 350 },
    optionB: { name: "Aloo Keema", items: "2 Roti + Salad", tags: ["Classic", "Filling"], imageSrc: foodImages.alooKeema, price: 350 }
  },
  {
    day: "Friday",
    optionA: { name: "Chicken Biryani", items: "Mint Raita + Salad", tags: ["Friday Special", "Popular"], imageSrc: foodImages.biryani, price: 350 },
    optionB: { name: "Chicken Pulao", items: "Raita + Salad", tags: ["Mild", "Team Friendly"], imageSrc: foodImages.chickenBiryani, price: 350 }
  },
  {
    day: "Saturday",
    optionA: { name: "Chicken Karahi", items: "2 Roti + Salad", tags: ["Premium", "Add-on"], imageSrc: foodImages.chickenKarahi, price: 350 },
    optionB: { name: "Chana Pulao", items: "Raita + Salad", tags: ["Budget", "Add-on"], imageSrc: foodImages.chanaPulao, price: 350 },
    isAddon: true
  }
];

export const plans = [
  {
    name: "Single Meal",
    price: 350,
    cadence: "per meal",
    description: "Try one homemade office lunch before subscribing.",
    features: ["One lunch", "Office delivery", "WhatsApp confirmation"]
  },
  {
    name: "Weekly Office Plan",
    price: 1750,
    cadence: "5 working days",
    description: "Best for regular office lunch without daily decision fatigue.",
    features: ["Monday to Friday", "Two daily options", "Pause support", "Priority delivery"],
    highlighted: true
  },
  {
    name: "Monthly Subscription",
    price: 6500,
    cadence: "per month",
    description: "Best value for professionals who want daily ghar ka khana.",
    features: ["Approx. 20 lunches", "Weekly menu selection", "Order history", "Support included"]
  }
];
