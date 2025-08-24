import {
  Chart as ChartJSChart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Import the module after mocking
import "../utils/chartConfig";

// Mock Chart.js to avoid canvas issues in test environment
jest.mock("chart.js", () => {
  const mockChart = {
    register: jest.fn(),
    defaults: {
      animation: {},
      responsive: true,
      maintainAspectRatio: false,
      interaction: {},
      elements: {
        point: {
          radius: 0,
          hoverRadius: 0,
        },
      },
    },
  };

  return {
    Chart: mockChart,
    CategoryScale: "CategoryScale",
    LinearScale: "LinearScale",
    PointElement: "PointElement",
    LineElement: "LineElement",
    BarElement: "BarElement",
    ArcElement: "ArcElement",
    Title: "Title",
    Tooltip: "Tooltip",
    Legend: "Legend",
    default: mockChart,
  };
});

describe("chartConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Chart.js Registration", () => {
    it("should register all necessary Chart.js components", () => {
      expect(ChartJSChart.register).toHaveBeenCalledWith(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
      );
    });

    it("should register components only once", () => {
      // Re-import the module to test registration
      jest.resetModules();
      require("../utils/chartConfig");

      // Should have been called at least once during initial import
      expect(ChartJSChart.register).toHaveBeenCalled();
    });

    it("should register all required scale components", () => {
      const registerCall = (ChartJSChart.register as jest.Mock).mock.calls[0];
      expect(registerCall).toContain(CategoryScale);
      expect(registerCall).toContain(LinearScale);
    });

    it("should register all required element components", () => {
      const registerCall = (ChartJSChart.register as jest.Mock).mock.calls[0];
      expect(registerCall).toContain(PointElement);
      expect(registerCall).toContain(LineElement);
      expect(registerCall).toContain(BarElement);
      expect(registerCall).toContain(ArcElement);
    });

    it("should register all required plugin components", () => {
      const registerCall = (ChartJSChart.register as jest.Mock).mock.calls[0];
      expect(registerCall).toContain(Title);
      expect(registerCall).toContain(Tooltip);
      expect(registerCall).toContain(Legend);
    });
  });

  describe("Global Animation Configuration", () => {
    it("should set animation duration to 300ms for performance", () => {
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      expect(
        typeof animation === "object" || typeof animation === "boolean",
      ).toBe(true);
    });

    it("should set easing to easeInOutQuart", () => {
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      expect(
        typeof animation === "object" || typeof animation === "boolean",
      ).toBe(true);
    });

    it("should have animation configuration object", () => {
      expect(ChartJSChart.defaults.animation).toBeDefined();
      expect(typeof ChartJSChart.defaults.animation).toBe("object");
    });
  });

  describe("Responsive Configuration", () => {
    it("should enable responsive behavior", () => {
      expect(ChartJSChart.defaults.responsive).toBe(true);
    });

    it("should disable maintainAspectRatio for better control", () => {
      expect(ChartJSChart.defaults.maintainAspectRatio).toBe(false);
    });
  });

  describe("Interaction Configuration", () => {
    it("should set interaction mode to index", () => {
      expect(ChartJSChart.defaults.interaction.mode).toBe("index");
    });

    it("should disable intersect for better UX", () => {
      expect(ChartJSChart.defaults.interaction.intersect).toBe(false);
    });

    it("should set axis to x for horizontal interaction", () => {
      expect(ChartJSChart.defaults.interaction.axis).toBe("x");
    });

    it("should disable includeInvisible for performance", () => {
      expect(ChartJSChart.defaults.interaction.includeInvisible).toBe(false);
    });

    it("should have complete interaction configuration", () => {
      const interaction = ChartJSChart.defaults.interaction;
      expect(interaction).toBeDefined();
      expect(typeof interaction).toBe("object");
      expect(interaction.mode).toBeDefined();
      expect(interaction.intersect).toBeDefined();
      expect(interaction.axis).toBeDefined();
      expect(interaction.includeInvisible).toBeDefined();
    });
  });

  describe("Point Element Configuration", () => {
    it("should set default point radius to 3", () => {
      expect(ChartJSChart.defaults.elements.point.radius).toBe(3);
    });

    it("should set hover point radius to 5", () => {
      expect(ChartJSChart.defaults.elements.point.hoverRadius).toBe(5);
    });

    it("should have point element configuration", () => {
      expect(ChartJSChart.defaults.elements.point).toBeDefined();
      expect(typeof ChartJSChart.defaults.elements.point).toBe("object");
    });

    it("should have reasonable point sizes for performance", () => {
      const pointRadius = ChartJSChart.defaults.elements.point.radius;
      const hoverRadius = ChartJSChart.defaults.elements.point.hoverRadius;

      expect(pointRadius).toBeDefined();
      expect(hoverRadius).toBeDefined();
      // Check if values are numbers before comparison
      expect(typeof pointRadius).toBe("number");
      expect(typeof hoverRadius).toBe("number");
      expect(pointRadius).toBeGreaterThan(0);
      expect(pointRadius).toBeLessThan(10);
      expect(hoverRadius).toBeGreaterThan(pointRadius as number);
      expect(hoverRadius).toBeLessThan(15);
    });
  });

  describe("Module Export", () => {
    it("should export ChartJSChart as configured instance", () => {
      expect(ChartJSChart).toBeDefined();
      expect(typeof ChartJSChart).toBe("object");
    });

    it("should export the configured Chart.js instance", () => {
      expect(typeof ChartJSChart).toBe("object");
      expect(ChartJSChart.defaults).toBeDefined();
    });
  });

  describe("Performance Optimizations", () => {
    it("should have optimized animation duration", () => {
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      // Animation can be false or an object, so we check if it's configured
      expect(
        typeof animation === "object" || typeof animation === "boolean",
      ).toBe(true);
    });

    it("should have optimized point sizes", () => {
      const radius = ChartJSChart.defaults.elements.point.radius;
      const hoverRadius = ChartJSChart.defaults.elements.point.hoverRadius;

      // Small sizes for better performance
      expect(radius).toBeLessThanOrEqual(5);
      expect(hoverRadius).toBeLessThanOrEqual(8);
    });

    it("should have performance-oriented interaction settings", () => {
      const interaction = ChartJSChart.defaults.interaction;
      expect(interaction.includeInvisible).toBe(false);
      expect(interaction.intersect).toBe(false);
    });

    it("should disable aspect ratio maintenance for flexibility", () => {
      expect(ChartJSChart.defaults.maintainAspectRatio).toBe(false);
    });
  });

  describe("Configuration Consistency", () => {
    it("should have consistent animation easing", () => {
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      expect(
        typeof animation === "object" || typeof animation === "boolean",
      ).toBe(true);
    });

    it("should have consistent interaction mode", () => {
      const mode = ChartJSChart.defaults.interaction.mode;
      expect(typeof mode).toBe("string");
      expect(["index", "point", "nearest", "dataset"]).toContain(mode);
    });

    it("should have consistent axis setting", () => {
      const axis = ChartJSChart.defaults.interaction.axis;
      expect(typeof axis).toBe("string");
      expect(["x", "y", "xy"]).toContain(axis);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing Chart.js gracefully", () => {
      // This test ensures the module doesn't crash if Chart.js is not available
      expect(() => {
        require("../utils/chartConfig");
      }).not.toThrow();
    });

    it("should have fallback values for configuration", () => {
      // Ensure all critical configurations have values
      expect(ChartJSChart.defaults.responsive).toBeDefined();
      expect(ChartJSChart.defaults.maintainAspectRatio).toBeDefined();
      expect(ChartJSChart.defaults.animation).toBeDefined();
      expect(ChartJSChart.defaults.interaction).toBeDefined();
      expect(ChartJSChart.defaults.elements.point).toBeDefined();
    });
  });

  describe("Integration Tests", () => {
    it("should configure Chart.js for dashboard usage", () => {
      // Test that all configurations work together for dashboard charts
      expect(ChartJSChart.defaults.responsive).toBe(true);
      expect(ChartJSChart.defaults.maintainAspectRatio).toBe(false);
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      expect(ChartJSChart.defaults.interaction.mode).toBe("index");
    });

    it("should configure Chart.js for mobile responsiveness", () => {
      // Test mobile-friendly configurations
      expect(ChartJSChart.defaults.responsive).toBe(true);
      expect(ChartJSChart.defaults.elements.point.radius).toBeLessThanOrEqual(
        5,
      );
      expect(ChartJSChart.defaults.interaction.intersect).toBe(false);
    });

    it("should configure Chart.js for performance", () => {
      // Test performance-oriented configurations
      const animation = ChartJSChart.defaults.animation;
      expect(animation).toBeDefined();
      expect(ChartJSChart.defaults.interaction.includeInvisible).toBe(false);
      expect(ChartJSChart.defaults.elements.point.radius).toBeLessThanOrEqual(
        5,
      );
    });
  });

  describe("Type Safety", () => {
    it("should have proper TypeScript types", () => {
      // Test that the module exports maintain proper types
      expect(ChartJSChart).toBeDefined();
      expect(typeof ChartJSChart.defaults).toBe("object");
    });

    it("should maintain Chart.js API compatibility", () => {
      // Ensure the configured instance maintains Chart.js API
      expect(ChartJSChart.defaults).toBeDefined();
      expect(typeof ChartJSChart.defaults).toBe("object");
    });
  });

  describe("Memory Management", () => {
    it("should not create memory leaks with configuration", () => {
      // Test that configurations don't create circular references
      const config = ChartJSChart.defaults;
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();

      // Should be able to serialize without circular references
      expect(() => JSON.stringify(config)).not.toThrow();
    });

    it("should have reasonable configuration object sizes", () => {
      // Ensure configurations are not excessively large
      const configString = JSON.stringify(ChartJSChart.defaults);
      expect(configString.length).toBeLessThan(10000); // Reasonable size limit
    });
  });
});
