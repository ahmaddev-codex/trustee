import type { IconType } from "react-icons";
import {
  TbDeviceDesktop,
  TbDeviceDesktopFilled,
  TbShirt,
  TbShirtFilled,
  TbHome,
  TbHomeFilled,
  TbCar,
  TbCarFilled,
  TbDeviceMobile,
  TbDeviceMobileFilled,
  TbCategory,
  TbCategoryFilled,
} from "react-icons/tb";

import type { listingCategories } from "@/lib/validations/listing";

type Category = (typeof listingCategories)[number];

const categoryIcons: Record<Category, IconType> = {
  Electronics: TbDeviceDesktop,
  Fashion: TbShirt,
  "Home & Furniture": TbHome,
  Vehicles: TbCar,
  "Phones & Tablets": TbDeviceMobile,
  Other: TbCategory,
};

const categoryIconsFilled: Record<Category, IconType> = {
  Electronics: TbDeviceDesktopFilled,
  Fashion: TbShirtFilled,
  "Home & Furniture": TbHomeFilled,
  Vehicles: TbCarFilled,
  "Phones & Tablets": TbDeviceMobileFilled,
  Other: TbCategoryFilled,
};

export function CategoryIcon({
  category,
  active,
  className,
}: {
  category: Category;
  active?: boolean;
  className?: string;
}) {
  const Icon = active ? categoryIconsFilled[category] : categoryIcons[category];
  return <Icon className={className} />;
}
