# xkcd-cn-crawler
Crawler for xkcd.in


## APIs
-----

- `/refresh`

  Synchronize with xkcd.in site to parse all unknown comics.

- `/archive`

  Show the archive of current localized comics.

- `/{comicId}/info.0.json`

  Show the JSON of a specific comic, `/info.0.json` for the latest.

- `/{comicId}`

  Show the a specific comic, `/` for the latest.
