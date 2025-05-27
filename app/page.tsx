import { UserButton } from "@clerk/nextjs";
import ThemeToggler from "@/components/theme-toggler";

export default function Home() {
  return (
    <div>
      <UserButton />
      <ThemeToggler />
    </div>
  );
}