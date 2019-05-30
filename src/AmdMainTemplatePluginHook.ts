import * as webpack from "webpack";
import * as Template from "webpack/lib/Template";

export default class AmdMainTemplatePluginHook {
  apply(compilation: webpack.compilation.Compilation) {
    const { mainTemplate, chunkTemplate } = compilation;

    if (!mainTemplate || !chunkTemplate) {
      return;
    }

    for (const template of [mainTemplate, chunkTemplate]) {
      const _template = template as any;
      if (_template.hooks.renderWithEntry) {
        _template.hooks.renderWithEntry.tap(
          "AmdMainTemplatePluginHook",
          this.onRenderWithEntry
        );
      }
    }
  }

  onRenderWithEntry = (source, chunk, hash) => {
    const externals = chunk.getModules().filter(m => m.external);
    const externalsArgumentsOriginal = externals
      .map(
        m => `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(`${m.id}`)}__`
      )
      .join(", ");

    const externalsArguments = externals
      .map(
        m =>
          `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(`${m.request}`)}__`
      )
      .join(", ");

    source.children[0] = source.children[0].replace(externalsArgumentsOriginal, externalsArguments);
    return source;
  };
}
