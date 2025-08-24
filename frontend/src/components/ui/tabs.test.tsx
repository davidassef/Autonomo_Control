import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock do Radix UI Tabs
const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

const mockRoot = React.forwardRef<HTMLDivElement, any>(
  ({ children, value, onValueChange, defaultValue, ...props }, ref) => {
    const [currentValue, setCurrentValue] = React.useState(
      value || defaultValue || "",
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(value);
      }
    }, [value]);

    const handleValueChange = (newValue: string) => {
      setCurrentValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider
        value={{ value: currentValue, onValueChange: handleValueChange }}
      >
        <div ref={ref} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);
mockRoot.displayName = "Tabs";

const mockList = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} role="tablist" {...props}>
      {children}
    </div>
  ),
);
mockList.displayName = "TabsList";

const mockTrigger = React.forwardRef<HTMLButtonElement, any>(
  ({ children, className, value, disabled, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    const handleClick = () => {
      if (!disabled && context.onValueChange) {
        context.onValueChange(value);
      }
    };

    return (
      <button
        ref={ref}
        className={className}
        onClick={handleClick}
        disabled={disabled}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        {...props}
      >
        {children}
      </button>
    );
  },
);
mockTrigger.displayName = "TabsTrigger";

const mockContent = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={className}
        role="tabpanel"
        data-state={isActive ? "active" : "inactive"}
        {...props}
      >
        {children}
      </div>
    );
  },
);
mockContent.displayName = "TabsContent";

jest.mock("@radix-ui/react-tabs", () => ({
  Root: mockRoot,
  List: mockList,
  Trigger: mockTrigger,
  Content: mockContent,
}));

describe("Tabs Components", () => {
  describe("Tabs Root", () => {
    it("deve renderizar o Tabs", () => {
      render(
        <Tabs data-testid="tabs">
          <div>Content</div>
        </Tabs>,
      );

      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(
        <Tabs data-testid="tabs">
          <div>Content</div>
        </Tabs>,
      );

      const tabs = screen.getByTestId("tabs");
      expect(tabs.tagName).toBe("DIV");
    });

    it("deve aceitar defaultValue", () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByTestId("trigger2")).toHaveAttribute(
        "data-state",
        "inactive",
      );
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    });

    it("deve aceitar value controlado", () => {
      const { rerender } = render(
        <Tabs value="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      rerender(
        <Tabs value="tab2" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger2")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("deve chamar onValueChange quando valor muda", async () => {
      const user = userEvent;
      const onValueChange = jest.fn();

      render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      await user.click(screen.getByTestId("trigger2"));
      expect(onValueChange).toHaveBeenCalledWith("tab2");
    });
  });

  describe("TabsList", () => {
    it("deve renderizar o TabsList", () => {
      render(
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>,
      );

      expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
    });

    it("deve renderizar como div com role tablist", () => {
      render(
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>,
      );

      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList.tagName).toBe("DIV");
      expect(tabsList).toHaveAttribute("role", "tablist");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>,
      );

      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList).toHaveClass(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <TabsList className="custom-tabs-list" data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>,
      );

      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList).toHaveClass("custom-tabs-list");
      expect(tabsList).toHaveClass("inline-flex h-10"); // classes padrão
    });

    it("deve renderizar múltiplos triggers", () => {
      render(
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">
            Tab 2
          </TabsTrigger>
          <TabsTrigger value="tab3" data-testid="trigger3">
            Tab 3
          </TabsTrigger>
        </TabsList>,
      );

      expect(screen.getByTestId("trigger1")).toBeInTheDocument();
      expect(screen.getByTestId("trigger2")).toBeInTheDocument();
      expect(screen.getByTestId("trigger3")).toBeInTheDocument();
    });
  });

  describe("TabsTrigger", () => {
    it("deve renderizar o TabsTrigger", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("deve renderizar como button com role tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger.tagName).toBe("BUTTON");
      expect(trigger).toHaveAttribute("role", "tab");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
      );
    });

    it("deve aplicar classes de foco", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      );
    });

    it("deve aplicar classes de estado ativo", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass(
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      );
    });

    it("deve aplicar classes de disabled", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass(
        "disabled:pointer-events-none disabled:opacity-50",
      );
    });

    it("deve ter estado ativo quando selecionado", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("trigger2")).toHaveAttribute(
        "data-state",
        "inactive",
      );
      expect(screen.getByTestId("trigger2")).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("deve alternar estado ao clicar", async () => {
      const user = userEvent;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger1 = screen.getByTestId("trigger1");
      const trigger2 = screen.getByTestId("trigger2");

      expect(trigger1).toHaveAttribute("data-state", "active");
      expect(trigger2).toHaveAttribute("data-state", "inactive");

      await user.click(trigger2);

      expect(trigger1).toHaveAttribute("data-state", "inactive");
      expect(trigger2).toHaveAttribute("data-state", "active");
    });

    it("deve aceitar propriedade disabled", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeDisabled();
    });

    it("não deve alternar quando disabled", async () => {
      const user = userEvent;
      const onValueChange = jest.fn();

      render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" disabled data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      await user.click(screen.getByTestId("trigger2"));

      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger
              value="tab1"
              className="custom-trigger"
              data-testid="trigger"
            >
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("custom-trigger");
      expect(trigger).toHaveClass("inline-flex items-center"); // classes padrão
    });
  });

  describe("TabsContent", () => {
    it("deve renderizar o TabsContent quando ativo", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("não deve renderizar o TabsContent quando inativo", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab2" data-testid="content">
            Content 2
          </TabsContent>
        </Tabs>,
      );

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    });

    it("deve renderizar como div com role tabpanel", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId("content");
      expect(content.tagName).toBe("DIV");
      expect(content).toHaveAttribute("role", "tabpanel");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent
            value="tab1"
            className="custom-content"
            data-testid="content"
          >
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass("custom-content");
      expect(content).toHaveClass("mt-2 ring-offset-background"); // classes padrão
    });

    it("deve alternar conteúdo quando tab muda", async () => {
      const user = userEvent;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("trigger2"));

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para TabsList", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <TabsList ref={ref} data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve encaminhar ref para TabsTrigger", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger ref={ref} value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe("BUTTON");
    });

    it("deve encaminhar ref para TabsContent", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <Tabs defaultValue="tab1">
          <TabsContent ref={ref} value="tab1" data-testid="content">
            Content
          </TabsContent>
        </Tabs>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura ARIA correta", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content1">
            Content 1
          </TabsContent>
          <TabsContent value="tab2" data-testid="content2">
            Content 2
          </TabsContent>
        </Tabs>,
      );

      expect(screen.getByTestId("tabs-list")).toHaveAttribute(
        "role",
        "tablist",
      );
      expect(screen.getByTestId("trigger1")).toHaveAttribute("role", "tab");
      expect(screen.getByTestId("trigger2")).toHaveAttribute("role", "tab");
      expect(screen.getByTestId("content1")).toHaveAttribute(
        "role",
        "tabpanel",
      );
    });

    it("deve ter aria-selected correto", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(screen.getByTestId("trigger1")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("trigger2")).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("deve ser navegável por teclado", async () => {
      const user = userEvent;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const trigger1 = screen.getByTestId("trigger1");
      const trigger2 = screen.getByTestId("trigger2");

      // Focar primeiro trigger
      trigger1.focus();
      expect(trigger1).toHaveFocus();

      // Navegar para segundo trigger com Tab
      await user.keyboard("{Tab}");
      expect(trigger2).toHaveFocus();

      // Ativar com Enter
      await user.keyboard("{Enter}");
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("deve ter estilos de foco visível", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const trigger = screen.getByTestId("trigger");
      const content = screen.getByTestId("content");

      expect(trigger).toHaveClass("focus-visible:ring-2");
      expect(content).toHaveClass("focus-visible:ring-2");
    });
  });

  describe("Display Names", () => {
    it("deve ter displayNames corretos", () => {
      expect(TabsList.displayName).toBe("TabsList");
      expect(TabsTrigger.displayName).toBe("TabsTrigger");
      expect(TabsContent.displayName).toBe("TabsContent");
    });
  });

  describe("Casos de Uso", () => {
    it("deve funcionar como navegação de seções", async () => {
      const user = userEvent;

      render(
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <h2>Profile Information</h2>
            <p>Your profile details</p>
          </TabsContent>
          <TabsContent value="settings">
            <h2>Settings</h2>
            <p>Application settings</p>
          </TabsContent>
          <TabsContent value="notifications">
            <h2>Notifications</h2>
            <p>Notification preferences</p>
          </TabsContent>
        </Tabs>,
      );

      expect(screen.getByText("Profile Information")).toBeInTheDocument();

      await user.click(screen.getByTestId("settings-tab"));
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.queryByText("Profile Information")).not.toBeInTheDocument();
    });

    it("deve funcionar com conteúdo complexo", () => {
      render(
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div>
              <h3>Overview</h3>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
              <button>Action Button</button>
            </div>
          </TabsContent>
          <TabsContent value="details">
            <form>
              <input type="text" placeholder="Name" />
              <textarea placeholder="Description" />
              <button type="submit">Submit</button>
            </form>
          </TabsContent>
        </Tabs>,
      );

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Action Button")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Name")).not.toBeInTheDocument();
    });

    it("deve funcionar com estado controlado", () => {
      const ControlledTabs = () => {
        const [activeTab, setActiveTab] = React.useState("tab1");

        return (
          <div>
            <button
              onClick={() => setActiveTab("tab2")}
              data-testid="external-button"
            >
              Switch to Tab 2
            </button>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">Content 1</TabsContent>
              <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
          </div>
        );
      };

      render(<ControlledTabs />);

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("external-button"));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });

  describe("Integração Completa", () => {
    it("deve renderizar tabs completas funcionais", async () => {
      const user = userEvent;

      render(
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password" data-testid="password-tab">
              Password
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="name">Name</label>
              <input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <label htmlFor="username">Username</label>
              <input id="username" defaultValue="@peduarte" />
            </div>
          </TabsContent>
          <TabsContent value="password" className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="current">Current password</label>
              <input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new">New password</label>
              <input id="new" type="password" />
            </div>
          </TabsContent>
        </Tabs>,
      );

      // Verificar conteúdo inicial
      expect(screen.getByDisplayValue("Pedro Duarte")).toBeInTheDocument();
      expect(screen.getByDisplayValue("@peduarte")).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Current password"),
      ).not.toBeInTheDocument();

      // Alternar para tab de password
      await user.click(screen.getByTestId("password-tab"));

      expect(screen.getByLabelText("Current password")).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue("Pedro Duarte"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com muitas tabs", () => {
      const tabs = Array.from({ length: 20 }, (_, i) => ({
        value: `tab${i + 1}`,
        label: `Tab ${i + 1}`,
        content: `Content ${i + 1}`,
      }));

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>,
      );

      expect(screen.getByText("Tab 1")).toBeInTheDocument();
      expect(screen.getByText("Tab 20")).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });
});
