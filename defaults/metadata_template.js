
function render(data) {

return `

<html>
<head>


<script type="application/ld+json"> 
  ${data.json}
</script>
<title>
${data.title}
</title>
<link rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
      integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
      crossorigin="anonymous"/>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

<meta charset='utf-8'/>
<style>

table.table {
  padding-bottom: 300px;
}
</style>
</head>


<body>

  <nav class="navbar">

    <ul class="nav navbar-nav" >
        <li><a href="${data.getLinkToPath("/",data.crate)}"><span class="glyphicon glyphicon-home dataset_name">&nbsp; Home</a></span></a></li>
    </ul>

  </nav>
<div class="container">
<div class="jumbotron">
 <a href="${data.getLinkToMetadata("/", data.crate)}">⬇️🏷️ Download metadata</a>

<h1 class="item_name">${data.heading}</h4>


<div class="check"></div>
</div>



<div id="summary">
${data.content}

</div>




</body>
</html>
`}

module.exports = render;