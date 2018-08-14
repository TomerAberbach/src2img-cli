# src2img CLI

[![NPM version](https://img.shields.io/npm/v/src2img-cli.svg)](https://www.npmjs.com/package/src2img-cli) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> Converts source code to high quality images.

## Install

Install with [npm](https://www.npmjs.com):

```sh
$ npm i src2img-cli -g
```

If you encounter permission errors run the following instead:

```sh
$ sudo npm i src2img-cli -g --unsafe-perm=true --allow-root
```

The permission errors are related to [puppeteer](https://www.npmjs.com/package/puppeteer). See this [issue](https://github.com/GoogleChrome/puppeteer/issues/1597).

## Usage

Display the help information:

```sh
$ src2img --help
```

Output:

```
Usage: index [options] [command]

  Options:

    -V, --version                    output the version number
    -h, --help                       output usage information

  Commands:

    render [options] <filenames...>  converts source code to high quality images
    presets                          lists saved presets
    open                             opens the presets file
```

Display the render help information:

```sh
$ src2img render --help
```

Output:

```
Usage: render [options] <filenames...>

  converts source code to high quality images

  Options:

    -o, --out <dir>      specifies an output directory (default: .)
    -t, --type <type>    specifies an output file type (png or jpeg) (default: png)
    -n, --port <number>  specifies a port number (default: 8888)
    -p, --preset <name>  uses a preset
    -h, --help           output usage information
```

Simple rendering example:

```sh
$ src2img myfile.js
```

Follow the prompts as they pop up and feel free to save a preset! You can reuse a saved preset using the `-p` or `--preset` flag as shown above.

Note that the best way to increase the resolution of the rendered image is to choose a high font size in the prompts.

Some rendered code:

![example](example.png)

## Related

 * [filename2prism](https://www.npmjs.com/package/filename2prism)
 * [src2img](https://www.npmjs.com/package/src2img)
 
## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/TomerAberbach/src2img-cli/issues/new).

## Running Tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Author

**Tomer Aberbach**

* [Github](https://github.com/TomerAberbach)
* [NPM](https://www.npmjs.com/~tomeraberbach)
* [LinkedIn](https://www.linkedin.com/in/tomer-a)
* [Website](https://tomeraberba.ch)

## License

Copyright © 2018 [Tomer Aberbach](https://github.com/TomerAberbach)
Released under the [MIT license](https://github.com/TomerAberbach/src2img-cli/blob/master/LICENSE).
