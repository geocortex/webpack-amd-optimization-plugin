import * as webpack from "webpack";
import * as Template from "webpack/lib/Template";

export default class RunTimeTemplatePatch {
  apply(compilation: webpack.compilation.Compilation): void {
    const _runtimeTemplate = compilation.runtimeTemplate as any;
    _runtimeTemplate.moduleRaw = ({ module, request }) =>
      this.moduleRaw(_runtimeTemplate, module, request);
  }

  moduleRaw(runtimeTemplate, module, request) {
    if (!module) {
      return runtimeTemplate.missingModule({
        request
      });
    }

    return module.externalType === "amd"
      ? `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(
          `${module.request}`
        )}__`
      : `__webpack_require__(${runtimeTemplate.moduleId({ module, request })})`;
  }
}
