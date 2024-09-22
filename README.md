# qsr

a powerful tool to control and evaluate data of view (html elements)
it's syntax looks like css and behaves as it too
it extends html property to add eval porperty which use to extract data as sturcted in html
it uses some coustom attribute for html like : data-key, data-branch, data-item, data-wrapper

# eval property

It extends HTMLElement prototype to define new property eval.
using this property you can get or set to html like any other property.
the structure of the returned object is defined by "data-key" ,"data-branch".

## elements value

Text related elements like p, span will bound to element's textContent.
Input related elements like text-input and textarea will target their value property
And others will set to a custom data attribute called "x".

notice the returned objecct is simply a proxy on html element's value.(textContent or value for input elements) so be careful when you want to pass this object

# data-key

elements with "data-key" attribute marks themselves as holder for data and the attribute's value will be used for naming field of returned object
or when setting an object to element via eval property

It is depends on type of the element to determine the value of the element
For example text-input element will be its value propert, text related elements will be the `textContent` property and the rest will create an attribute called `data-x` and set the value to this attribute.

# data-branch

The "data-branch" attribute is for grouping child elements with "data-key" attribute into a new structure(object)
data-key cannot be coexist with data-branch and it will be escaped if so

# data-item

used to handle new item addition with the help of templates by using "data-item" attribute
the value of this attribute must be the id name of a template
