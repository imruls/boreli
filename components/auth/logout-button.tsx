import { Button } from "@/components/ui/button";
import { logout } from "@/app/(dashboard)/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        Cerrar sesión
      </Button>
    </form>
  );
}
