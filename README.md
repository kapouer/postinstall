postinstall
===========

Transform files of Node.js modules after installation.

How
---

Depend on this package:
`npm install postinstall --save`


and declare transformations in package.json:

```
{
  ../..
  "dependencies": {
    "jquery": "3",
    "postinstall": "1"
  },
  "postinstall": {
    "jquery/dist/jquery.slim.min.js": "link public/js/jquery.min.js",
    "jquery/dist/jquery.slim.min.map": "link public/js/jquery.min.js.map"
  },
  "scripts": {
    "postinstall": "postinstall"
  }
  ../..
}
```

Syntax
------

## ini-style in .postinstall

Commands are shorthands with working default values:

```
[postinstall]
<module>/<glob> = <command> <output>
```

Commands are available through installation of `postinstall-<command>` packages.

Each command receives the globbed paths and an object with options.

Long form syntax is:
```
[postinstall.<module>/<glob>]
command = <command>
output = <output>
<option> = <value>
```

## json-style in package.json

Short form
```
postinstall: {
	"<module>/<glob>": "<command> <output>"
}
```

Long form
```
postinstall: {
	"<module>/<glob>": {
		"command": "<command>",
		"output": "<output>",
		"<option>": "<value>"
	}
}
```

Command
-------

New commands can be added to postinstall and they just need to be available
as `postinstall-<command>` modules exporting a single function:

```
module.exports = function(input, output, options) {
	// input and output are valid paths, options is an object (possibly empty)
	// can return promise
};
```

Bundled commands: link, copy.

