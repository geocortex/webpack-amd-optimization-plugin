import * as webpack from "webpack";
import Compilation from "webpack/lib/Compilation";
import JsonpTemplateHook from "./JsonpMainTemplatePluginHook";
import JsonpChunkTemplateHook from "./JsonpChunkTemplatePluginHook";
import ExternalModuleHook from "./ExternalModuleHook";
import AmdMainTemplatePluginHook from "./AmdMainTemplatePluginHook";
import JavascriptGeneratorHook from "./JavascriptGeneratorHook";
import JavascriptModulesPluginHook from "./JavascriptModulesPluginHook";
import ModuleDependencyTemplateAsId from "./ModuleDependencyTemplateAsId";

type PluginOptions = {};

export default class AmdOptimizationPlugin {
  constructor(options: PluginOptions) {}

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      "AmdOptimizationPlugin",
      (compilation: Compilation, compilationParams: any) => {
        if (compilation.name) {
          return;
        }
        new JavascriptModulesPluginHook().apply(compilation);
      }
    );

    compiler.hooks.compilation.tap(
      "AmdOptimizationPlugin",
      (compilation: Compilation, compilationParams: any) => {
        const { normalModuleFactory } = compilationParams;

        compilation.hooks.optimizeDependenciesBasic.tap(
          "AmdOptimizationPlugin",
          () => {
            new ModuleDependencyTemplateAsId().apply(compilation);

            // patch javascript generator
            new JavascriptGeneratorHook().apply(
              compilation,
              normalModuleFactory
            );
          }
        );

        // patch javascript generator
        new JavascriptGeneratorHook().apply(compilation, normalModuleFactory);

        // update amd main template
        new AmdMainTemplatePluginHook().apply(compilation);

        // patch external modules
        new ExternalModuleHook().apply(compilation);

        // hook main loader for amd async require
        new JsonpTemplateHook().apply(compilation.mainTemplate);

        // hook chunk template for external module imports
        new JsonpChunkTemplateHook().apply(compilation.chunkTemplate);
      }
    );
  }
}
