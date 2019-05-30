import * as RequireHeaderDependency from "webpack/lib/dependencies/RequireHeaderDependency";
import * as CommonJsRequireDependency from "webpack/lib/dependencies/CommonJsRequireDependency";
import * as HarmonyImportSideEffectDependency from "webpack/lib/dependencies/HarmonyImportSideEffectDependency";
import * as HarmonyImportSpecifierDependency from "webpack/lib/dependencies/HarmonyImportSpecifierDependency";
import * as HarmonyExportImportedSpecifierDependency from "webpack/lib/dependencies/HarmonyExportImportedSpecifierDependency";

import * as ConstDependency from "webpack/lib/dependencies/ConstDependency";
import * as webpack from "webpack";

export default class JavascriptGeneratorHook {
  _constDependencyOriginal: any;

  apply(compilation: webpack.compilation.Compilation, normalModuleFactory) {
    this._constDependencyOriginal = Array.from(
      compilation.dependencyTemplates.keys()
    ).find(dt => dt.name === ConstDependency.name);

    if (
      normalModuleFactory.hooks &&
      normalModuleFactory.hooks.createGenerator
    ) {
      normalModuleFactory.hooks.generator
        .for("javascript/auto")
        .tap("JavascriptGeneratorHook", generator =>
          this.patchSourceBlockHook(generator)
        );
      normalModuleFactory.hooks.generator
        .for("javascript/dynamic")
        .tap("JavascriptGeneratorHook", generator =>
          this.patchSourceBlockHook(generator)
        );
      normalModuleFactory.hooks.generator
        .for("javascript/esm")
        .tap("JavascriptGeneratorHook", generator =>
          this.patchSourceBlockHook(generator)
        );
    }
  }

  patchSourceBlockHook(generator) {
    const originalSourceBlock = generator.sourceBlock;
    generator.sourceBlock = (
      module,
      block,
      availableVars,
      dependencyTemplates,
      source,
      runtimeTemplate
    ) =>
      this.sourceBlockHook(
        originalSourceBlock.bind(generator),
        module,
        block,
        availableVars,
        dependencyTemplates,
        source,
        runtimeTemplate
      );
  }

  sourceBlockHook(
    sourceBlock,
    module,
    block,
    availableVars,
    dependencyTemplates,
    source,
    runtimeTemplate
  ) {
    for (let i = 0; i < block.dependencies.length; i++) {
      let dependency = block.dependencies[i];
      let previousDependency = i > 0 && block.dependencies[i - 1];
      if (
        dependency.constructor.name === RequireHeaderDependency.name &&
        previousDependency.constructor.name ===
          CommonJsRequireDependency.name &&
        previousDependency.module &&
        previousDependency.module.externalType === "amd"
      ) {
        // these dependency can be changed to a const, it should already be 
        // available from amd require
        dependency = block.dependencies[i] = new this._constDependencyOriginal(
          "",
          dependency.range
        );
      }
      if (
        dependency.constructor.name ===
          HarmonyImportSideEffectDependency.name &&
        dependency.module &&
        dependency.module.externalType === "amd"
      ) {
        // just remove these dependencies we don't need them
        block.dependencies.splice(i, 1);
        i--;
      }
      
      if (
        dependency.constructor.name === HarmonyImportSpecifierDependency.name &&
        dependency.module &&
        dependency.module.externalType === "amd"
      ) {
        // setting sourceOrder here prevents these dependencies from being pulled into
        // the harmony init dependencies and being re-imported
        dependency.sourceOrder = NaN;
      }
    }

    sourceBlock(
      module,
      block,
      availableVars,
      dependencyTemplates,
      source,
      runtimeTemplate
    );
  }
}
