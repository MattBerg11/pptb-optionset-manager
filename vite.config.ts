import react from "@vitejs/plugin-react";
import type { Plugin, PluginOption } from "vite";
import { defineConfig } from "vite";

/**
 * Plugin to fix HTML for PPTB compatibility
 * - Removes crossorigin attribute (not needed for file:// URLs)
 * - Keeps type="module" for ES modules (required for code splitting)
 * - Moves script tags from head to end of body so DOM is ready before scripts execute
 */
function fixHtmlForPPTB(): Plugin {
  return {
    name: "fix-html-for-pptb",
    enforce: "post",
    transformIndexHtml(html) {
      // Remove crossorigin from script tags (file:// URLs don't need CORS)
      html = html.replace(/\s*crossorigin/g, "");
      // Clean up extra spaces around attributes
      html = html.replace(/\s+>/g, ">");

      // Move script tags from head to end of body
      // This ensures DOM is ready when scripts execute
      const scriptRegex = /(<script[^>]*src="[^"]*"[^>]*><\/script>)/g;
      const scripts: string[] = [];

      // Extract all script tags
      html = html.replace(scriptRegex, (match) => {
        scripts.push(match);
        return ""; // Remove from current position
      });

      // Insert scripts before closing body tag
      if (scripts.length > 0) {
        const scriptsHtml = "\n  " + scripts.join("\n  ");
        html = html.replace("</body>", scriptsHtml + "\n</body>");
      }

      return html;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig((configEnv) => {
  const plugins: PluginOption[] = [react()];

  if (configEnv.mode !== "development") {
    plugins.push(fixHtmlForPPTB());
  }

  return {
    plugins,
    base: "./",
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: configEnv.mode === "development",
      rollupOptions: {
        output: {
          // Use ES format for code splitting support
          // PPTB BrowserView supports ES modules
          format: "es",
        },
      },
    },
  };
});
