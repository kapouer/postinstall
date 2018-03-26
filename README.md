postinstall
===========

Transform files of Node.js modules after installation.

How
---

Depend on this package:
`npm install postinstall --save`

Declare postinstall script in package.json:

```
{
  "name": "mypkg",
  "version": "1.0.0",
  "dependencies": {
    "postinstall": "1"
  },
  "scripts": {
    "postinstall": "postinstall"
  }
}
```

From there, more dependencies and commands can be added:

```
{
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
}
```

It is also possible to configure postinstall in another json file:

```
{
  "dependencies": {
    "jquery": "3",
    "postinstall": "1"
  },
  "scripts": {
    "postinstall": "postinstall postinstall.json"
  }
}
```

with postinstall.json containing:
```
"postinstall": {
  "jquery/dist/jquery.slim.min.js": "link public/js/jquery.min.js",
  "jquery/dist/jquery.slim.min.map": "link public/js/jquery.min.js.map"
}
```


Syntax
------

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

