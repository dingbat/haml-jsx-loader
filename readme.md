# Haml :heart: JSX

[![npm version](https://badge.fury.io/js/haml-jsx-loader.svg)](https://www.npmjs.com/package/haml-jsx-loader) [![build status](https://api.travis-ci.org/dingbat/haml-jsx-loader.svg)](https://travis-ci.org/dingbat/haml-jsx-loader)

With this webpack loader you can inline [HAML](http://haml.info) in JSX by putting it between delimeters, `(~` and `~)` by default.

Use `{...}` to embed javascript into the HAML, just like JSX.

```javascript
render() {
  return (~
    #content
      .column.sidebar
        %Sidebar(property={value}
                 onSelect={() => ...})
        
      .column.main
        %h2 Welcome to our site!
        %p {info}
  ~);
}
```

## Installation

```
npm install haml-jsx-loader --save-dev
```

Add it to your `webpack.config`:

```javascript
...
module: {
  loaders: [
    // Make sure 'haml-jsx' is last!
    { test: /\.js$/, loaders: ['babel', 'haml-jsx'], ... },

    // Works with hot module replacement:
    { test: /\.js$/, loaders: ['react-hot', 'babel', 'haml-jsx'], ... },
  ]
},
...
```

If you want to use your own delimiters, load `haml-jsx` with a query passing them in.

```
'haml-jsx?open=(@&close=@)'
```

## Use

### Examples & features

One-line HAML:

```javascript
const icon = (~ %i.fa.fa-github ~);
```

Multi-line attributeutes

```javascript
const text = (~
  %textarea(name="message"
            placeholder="Your message here..."
            defaultValue={this.props.message})
~)

const text = (~
  %textarea(
    name="message"
    placeholder="Your message here..."
    defaultValue={this.props.message}
  )
~)
```

Nested `(~ ~)`:

```javascript
const menu = (~
  #menu
    {items.map((item) => (~ %Item(key={item.id} item={item}) ~))}
~)
```

Super-easy spacing control between elements with `>` and `<`, following [this syntax](https://github.com/creationix/haml-js/#whitespace):

```javascript
const backText = (~
  %p.lead
    Click
    %a(href="/")> here
    to go back.
~)
```

Use `.` for a `div`, even when there is no class or id, instead of having to use `%div`:

```javascript
const divs = (~
  .
    .one-div
    .two-div#with-id
    .
      #three-div
      .(class="four-div")
~);
```

Spreading props in the tag is supported:

```javascript
const props = { href:"http://google.com", target:"_blank" }
const link = (~
  %a({...props} alt="Link") {linkTitle}
~);
```

### Notes

* Use double quotes, not single quotes in property lists
* You may use `class=`, `className=` is no longer required
* Use [HTML-style, not Ruby-style](http://haml.info/docs/yardoc/file.REFERENCE.html#htmlstyle_attributes_), attribute lists: `%tag(key="val" key2={val2})`, not `%tag{key: "val"}`
