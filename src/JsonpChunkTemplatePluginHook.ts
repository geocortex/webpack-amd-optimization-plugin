import webpack = require("webpack");
import * as Template from "webpack/lib/Template";
import { ConcatSource } from "webpack-sources";

export default class JsonpChunkTemplatePluginHook {
  apply(chunkTemplate: any): void {
    if (chunkTemplate.hooks.render) {
      chunkTemplate.hooks.render.tap(
        "JsonpChunkTemplatePluginHook",
        (script: string, chunk, hash) => {
          let externals = [];

          if (!chunk.entryModule) {
            externals = []
              .concat(
                ...chunk
                  .getModules()
                  .map(m =>
                    m.dependencies.filter(
                      d => d.module && d.module.externalType === "amd"
                    )
                  )
              )
              .map(d => d.module);

            externals = externals.filter(function(value, index, self) {
              return self.indexOf(value) === index && value;
            });
          }

          const externalsDepsArray = JSON.stringify(
            externals.map(m =>
              typeof m.request === "object" ? m.request.amd : m.request
            )
          );

          const externalsArguments = externals
            .map(
              m =>
                `__WEBPACK_EXTERNAL_MODULE_${Template.toIdentifier(
                  `${m.request}`
                )}__`
            )
            .join(", ");

          if (externals.length > 0) {
            return new ConcatSource(`require(${externalsDepsArray}, function(${externalsArguments}) {`, script, "});");
          }

          return script;
        }
      );
    }
  }
}
