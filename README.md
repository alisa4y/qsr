# qsr

a powerful tool to control and evaluate data of view (html elements)
it's syntax looks like css and behaves as it too
it extends html property to add eval porperty which use to extract data as sturcted in html
it uses some coustom attribute for html like : data-key, data-branch, data-item, data-wrapper

# eval property

it extends HTMLElement prototype to define new property eval.
using this property you can get or set to html like any other property.
the structure of the returned object is defined by "data-key" ,"data-branch" and other attributes on html elements.
notice the returned objecct is simply a proxy on element's value(textContent or value for input elements) so be careful when you want to pass this object

# data-key

elements with "data-key" attribute marks themselves as holder for data and the attribute's value will be used for naming field of returned object
or when setting an object to element via eval property

# data-branch

the "data-branch" attribute is for grouping child elements with "data-key" attribute into a new structure(object)

# data-item

used to handle new item addition with the help of templates by using "data-item" attribute
the value of this attribute must be the id name of a template
the content of template will be wrapped in element which is derived from the parent element
for example the "tbody" parent will generate a "tr" element as wrapper and for lists ("ul", "ol") it will be "li"
and default will be "div" and you can give wrapper with attribute "data-wrapper"

# data-wrapper

you can pass the name of wrapper to be used in creation of new element for the element with `data-item` attribute
you can pass id , classes and custom attributes like css selector e.g. `div.bigBtn` or `div[data-branch="address"]`
