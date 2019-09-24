# xkcd-cn-crawler
Crawler for xkcd.in


## APIs
-----

- `/refresh`

  Synchronize with xkcd.in site to parse all unknown comics.
  
  * **URL Params**

| Name | Required | Type  | Description |
| ---  | :---:    | ---   | ---         |
|forcedAll|        |Integer| 1 to force update all |
| index |          |Integer| force update specific comic |


- `/archive`

  Show the archive of current localized comics.

- `/{comicId}/info.0.json`

  Show the JSON of a specific comic, `/info.0.json` for the latest.

- `/{comicId}`

  Show the a specific comic, `/` for the latest.
