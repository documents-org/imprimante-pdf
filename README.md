# Serveur d'impression

Un simple serveur de génération de .PDF entourant Puppeteer https://pptr.dev
Suite à des erreurs avec certaines polices de caractères, nous avons bloqué la version de puppeteer à ^1.12.2 en attente de résolutions upstream.

Par défaut, il tourne sur le port 3468.
Il propose deux options configurables via des variables d'environnement ou un fichier .env.
`PRINTSERVER_TOKEN`, un token autorisant ou non l'utilisation du service. Optionnel.
`PRINTSERVER_PORT`, le port sur lequel le service devrait tourner.

Les requêtes acceptent ces options :

```
Accepts a GET request with the form
http(s?)://service-url?
url={url:base64 string} the URL to render, as a base64 string.
&format={format:string} a paper format. Defaults to "A4".
&range={range:range} the page range to print. Defaults to printing only the first page.
&orientation={orientation:string} either "portrait" or "landscape", defaults to being portrait.
&width={width::dimension+unit} dimensions with units. Is overriden by the "format" parameter.
&height={height:dimension+unit} dimensions with units. Is overriden by the "format" parameter.
&background={background:bool-like} bool-like : pass 0 or 1 as a string, defaults to true
&token={token:string?} optional : if you'd like to compare against a PRINTSERVER_TOKEN env var.
```

Dans le cas où la requête ne suffit pas à assurer la génération d'un PDF, le serveur renvoie `400 Bad Request` en `text/plain`.
En cas de token configuré, et d'absence de token dans la requête, `401 unauthorized` en `text/plain`.
En cas de succès, simplement `201 {pdf}` en `application/pdf`.
