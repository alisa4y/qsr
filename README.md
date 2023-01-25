# jss

a powerful tool to easily evaluate data from or to html

# jss behaves as css

# eval property

it extends HTMLElement prototype to define new property eval
this value will be object which value are the value(or content) of elements which have the attribute "data-key" and
the keys are the value of this attribute

# data-item

used to handle new item addition with the help of templates by using "data-item" attribute
the content of template will be wrapped in element which is derived from the parent element
for example the "tbody" parent will generate a "tr" element as wrapper and for lists ("ul", "ol") it will be "li"
and default will be "div" and you can give wrapper with attribute "data-wrapper"

# data-key

# data-wrapper
