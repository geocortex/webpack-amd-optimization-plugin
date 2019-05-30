import * as Template from "webpack/lib/Template";
import * as HarmonyImportDependency from "webpack/lib/dependencies/HarmonyImportDependency";
import * as HarmonyImportSpecifierDependency from "webpack/lib/dependencies/HarmonyImportSpecifierDependency";
import * as webpack from "webpack";

export default class HarmonyImportSpecifierDependencyTemplateHook {
  apply(compilation: webpack.compilation.Compilation) {
    const HarmonyImportSpecifierDependencyOriginal = Array.from(
      compilation.dependencyTemplates.keys()
    ).find(dt => dt.name === HarmonyImportSpecifierDependency.name);
    compilation.dependencyTemplates.set(
      HarmonyImportSpecifierDependencyOriginal,
      new HarmonyImportSpecifierDependencyTemplate() as any
    );
  }
}

class HarmonyImportSpecifierDependencyTemplate extends HarmonyImportDependency.Template {
  apply(dep, source, runtime) {
    super.apply(dep, source, runtime);
    if (dep.module && dep.module.externalType === "amd") {
      let postFix = "";
      if (dep._id && dep._id !== "default") {
        const used = dep._module.isUsed(dep._id);
        if (!used) {
          const comment = Template.toNormalComment(`unused export ${dep._id}`);
          return `${comment} undefined`;
        }
        const comment =
          used !== dep._id ? Template.toNormalComment(dep._id) + " " : "";
        postFix = `[${comment}${JSON.stringify(used)}]`;
      }
      const content = `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(
        `${dep.module.request}`
      )}__${postFix}`;

      source.replace(dep.range[0], dep.range[1] - 1, content);
    } else {
      const content = this.getContent(dep, runtime);
      source.replace(dep.range[0], dep.range[1] - 1, content);
    }
  }

  getContent(dep, runtime) {
    const exportExpr = runtime.exportFromImport({
      module: dep._module,
      request: dep.request,
      exportName: dep._id,
      originModule: dep.originModule,
      asiSafe: dep.shorthand,
      isCall: dep.call,
      callContext: !dep.directImport,
      importVar: dep.getImportVar()
    });
    return dep.shorthand ? `${dep.name}: ${exportExpr}` : exportExpr;
  }
}
