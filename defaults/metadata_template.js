
function render(di, config) {
const {displayDisplayableValue, displayDisplayableProp, displayDisplayableItem} = require('../lib/display');

return `
<html>
<head>

<link rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
      integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
      crossorigin="anonymous"/>


<script type="application/ld+json"> 
  ${JSON.stringify(di.graph.json_ld, null, 2)}
</script>

<title>
${di.displayableProps.name}
</title>

<meta charset='utf-8'/>

</head>


<body>



<nav class="flex items-center justify-between flex-wrap bg-teal-500 p-6">
 
  <div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
    <div class="text-sm lg:flex-grow">
    
   
  </div>
</nav>

<h1>
${displayDisplayableProp(di.displayableProps.name, false)}
</h1>

${displayDisplayableItem(di)}


</body>
</html>
`}

module.exports = render;