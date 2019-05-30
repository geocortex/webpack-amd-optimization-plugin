import * as Template from "webpack/lib/Template";
import * as CommonJsRequireDependency from "webpack/lib/dependencies/CommonJsRequireDependency";
import * as RequireResolveDependency from "webpack/lib/dependencies/RequireResolveDependency";
import * as webpack from "webpack";

export default class ModuleDependencyTemplateAsIdHook {
  apply(compilation: webpack.compilation.Compilation) {
    const CommonJsRequireDependencyOriginal = Array.from(
      compilation.dependencyTemplates.keys()
    ).find(dt => dt.name === CommonJsRequireDependency.name);
    compilation.dependencyTemplates.set(
      CommonJsRequireDependencyOriginal,
      new ModuleDependencyTemplateAsId() as any
    );

    const RequireResolveDependencyOriginal = Array.from(
        compilation.dependencyTemplates.keys()
      ).find(dt => dt.name === RequireResolveDependency.name);
      compilation.dependencyTemplates.set(
        RequireResolveDependencyOriginal,
        new ModuleDependencyTemplateAsId() as any
      );
  }
}

class ModuleDependencyTemplateAsId {
  apply(dep, source, runtime) {
    if (!dep.range) return;

    if (dep.module && dep.module.externalType === "amd") {
      const content = `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(
        `${dep.module.request}`
      )}__`;

      source.replace(dep.range[0] - 1, dep.range[1], content);
    } else {
      const content = runtime.moduleId({
        module: dep.module,
        request: dep.request
      });

      source.replace(dep.range[0], dep.range[1] - 1, content);
    }
  }
}
