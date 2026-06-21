import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3",
          title: "group-[.toast]:!text-[15px] group-[.toast]:font-semibold group-[.toast]:leading-snug",
          description: "group-[.toast]:!text-sm group-[.toast]:!text-muted-foreground group-[.toast]:leading-relaxed",
          icon: "group-[.toast]:[&>svg]:h-5 group-[.toast]:[&>svg]:w-5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-sm",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
