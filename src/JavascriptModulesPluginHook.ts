import * as webpack from "webpack";
import * as Template from "webpack/lib/Template";
import * as Chunk from "webpack/lib/Chunk";
import { ConcatSource } from "webpack-sources";

export default class JavascriptModulesPluginHook {
  apply(compilation) {
    compilation.hooks.chunkAsset.tap(
      "JavascriptModulesPluginHook",
      (chunk : Chunk, fileName: string) => {
        const distinct = (value, index, self) => {
          return self.indexOf(value) === index;
        }
        chunk.files = chunk.files.filter(distinct);
      }
    );

    compilation.chunkTemplate.hooks.renderManifest.tap(
      "JavascriptModulesPluginHook",
      (result, options) => {
        const chunk = options.chunk;
        const outputOptions = options.outputOptions;
        const moduleTemplates = options.moduleTemplates;
        const dependencyTemplates = options.dependencyTemplates;
        const filenameTemplate =
          chunk.filenameTemplate || outputOptions.chunkFilename;

        result.push({
          render: () =>
            this.renderJavascript(
              compilation.chunkTemplate,
              chunk,
              moduleTemplates.javascript,
              dependencyTemplates
            ),
          filenameTemplate,
          pathOptions: {
            chunk,
            contentHashType: "javascript"
          },
          identifier: `chunk${chunk.id}`,
          hash: chunk.hash
        });

        return result;
      }
    );
  }

  renderJavascript(chunkTemplate, chunk, moduleTemplate, dependencyTemplates) {
    const moduleSources = Template.renderChunkModules(
      chunk,
      m => typeof m.source === "function" && m.externalType !== "amd",
      moduleTemplate,
      dependencyTemplates
    );
    const core = chunkTemplate.hooks.modules.call(
      moduleSources,
      chunk,
      moduleTemplate,
      dependencyTemplates
    );
    let source = chunkTemplate.hooks.render.call(
      core,
      chunk,
      moduleTemplate,
      dependencyTemplates
    );
    if (chunk.hasEntryModule()) {
      source = chunkTemplate.hooks.renderWithEntry.call(source, chunk);
    }
    chunk.rendered = true;
    return new ConcatSource(source, ";");
  }
}
