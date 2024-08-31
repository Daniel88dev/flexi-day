import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugifyText(text: string) {
  const updatedText = slugify(text, {
    replacement: "-",
    lower: true,
    remove: /[*+~.()'"!:@]/g,
  });

  return updatedText;
}
