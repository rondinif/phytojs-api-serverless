# PhytoJS API - Serverless : Azure Functions example
just an experiment to demonstrate that it is possible to reuse the PhytoJS library to create a public API in a servless runtime such as [Azure Functions Linux Consumption Preview](https://github.com/Azure/Azure-Functions/wiki/Azure-Functions-on-Linux-Preview)


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
[see LICENSE here](./LICENSE)


example API request:
``` bash
# call API to ask PhytoJS.app the resolved plants by name: origano
$ curl api.phytojs.app/v1/resolvedPlantsByName/origano
```
example API result:
``` json
{
  "name": "origano",
  "plants": [
    {
      "wdEntityId": "Q205265",
      "wdPageId": 201609,
      "wdSnippet": "genus of plants",
      "scientificName": "Origanum",
      "taxonRankId": "http://www.wikidata.org/entity/Q34740",
      "taxonRankLabel": "genus",
      "specieArticle": "https://species.wikimedia.org/wiki/Origanum",
      "image": "http://commons.wikimedia.org/wiki/Special:FilePath/Origanum-vulgare.JPG"
    },
    {
      "wdEntityId": "Q134283",
      "wdPageId": 136029,
      "wdSnippet": "species of plant",
      "scientificName": "Origanum vulgare",
      "taxonRankId": "http://www.wikidata.org/entity/Q7432",
      "taxonRankLabel": "species",
      "specieArticle": "https://species.wikimedia.org/wiki/Origanum_vulgare",
      "image": "http://commons.wikimedia.org/wiki/Special:FilePath/ChristianBauer%20flowering%20oregano.jpg"
    }
  ]
}
```

# Development
``` 
git clone https://github.com/rondinif/phytojs-api-serverless.git
code . 
```
developed with `vscode` and the  `ms-azuretools.vscode-azurefunctions` [Extension: Azure Functions](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions)

## Debug 
launch.json
```
{
    "version": "0.2.0",
    "configurations": [
        
        {
            "name": "Attach to Node Functions",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "preLaunchTask": "func: host start"
        }
    ]
}
```

## Optional caching service response in Redis Cache  
- local develoment: 
  - configuration: `local.settings.json`
  - runtime: `docker run --name ronda-redis -p 6379:6379 -d redis`
  - view log: `docker logs ronda-redis --follow`
  - play with redis: `docker exec -it ronda-redis sh` then `redis-cli`

- redis as cloud service:

**api.phytojs.app** use [Azure Cache for Redis](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/) the configuration of the Azure Functions includes: 
``` json 
  {
    "name": "REDIS_CACHE_HOST_NAME",
    "value": "<YOUR-REDIS-CHACHE-NAME-HERE>.windows.net",
    "slotSetting": false
  },
  {
    "name": "REDIS_CACHE_HOST_PORT",
    "value": "6380",
    "slotSetting": false
  },
  {
    "name": "REDIS_CACHE_KEY",
    "value": "<YOUR-REDIS-CHACHE-KEY>",
    "slotSetting": false
  },
```