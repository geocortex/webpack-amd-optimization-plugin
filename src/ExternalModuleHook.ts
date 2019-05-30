import * as webpack from "webpack";
import * as HarmonyExportImportedSpecifierDependency from "webpack/lib/dependencies/HarmonyExportImportedSpecifierDependency";
import * as HarmonyImportSpecifierDependency from "webpack/lib/dependencies/HarmonyImportSpecifierDependency";
import * as Template from "webpack/lib/Template";

export default class ExternalModuleHook {
  apply(compilation: webpack.compilation.Compilation) {
    compilation.hooks.succeedModule.tap("AmdOptimizationPlugin", module => {
      this.hookModuleAndDependencies(module);
    });
  }

  getImportVar(dependency) {
    if (dependency._module.externalType === "amd") {
      return `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(
        dependency._module.request
      )}__`;
    }

    let importVarMap = dependency.parserScope.importVarMap;
    if (!importVarMap)
      dependency.parserScope.importVarMap = importVarMap = new Map();
    let importVar = importVarMap.get(dependency._module);
    if (importVar) return importVar;

    importVar = `${Template.toIdentifier(
      `${dependency.userRequest}`
    )}__WEBPACK_IMPORTED_MODULE_${importVarMap.size}__`;
    importVarMap.set(dependency._module, importVar);

    return importVar;
  }

  getImportStatement(dependency, update, runtime) {
    if (dependency._module && dependency._module.externalType === "amd") {
      return "";
    }

    return runtime.importStatement({
      update,
      module: dependency._module,
      importVar: dependency.getImportVar(),
      request: dependency.request,
      originModule: dependency.originModule
    });
  }

  hookModuleAndDependencies(buildModule: webpack.compilation.Module): void {
    const _buildModule = buildModule as any;

    // external modules should not be removed from the referencing module or chunk
    if (_buildModule.externalType === "amd") {
      _buildModule.chunkCondition = () => true;
    }

    const dependencies = _buildModule.dependencies.filter(
      d =>
        d.constructor.name === HarmonyImportSpecifierDependency.name ||
        d.constructor.name === HarmonyExportImportedSpecifierDependency.name
    );

    for (const dependency of dependencies) {
      if (dependency.getImportVar) {
        // import vars should match the amd require pattern
        dependency.getImportVar = () => this.getImportVar(dependency);

        if (dependency.getImportStatement) {
          // export import dependencies will alway import externals and export them
          // since we only want it to export external modules not import them
          // stub out the dependency
          dependency.getImportStatement = (update, runtime) =>
            this.getImportStatement(dependency, update, runtime);
        }
      }
    }
  }
}
