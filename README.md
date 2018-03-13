# gooddata-data-layer
> JavaScript library to obtain data for custom visualizations from GoodData platform.

## Getting started

### Usage

With [yarn](https://yarnpkg.com) installed, go to your project directory and run

```sh
$ yarn add @gooddata/data-layer
```

If you prefer [npm](npmjs.com) run
```sh
$ npm install @gooddata/data-layer
```

## Documentation
 - [DataLayer](https://help.gooddata.com/display/bHsp5IhQjuz0e6HS0s76/DataLayer)
 - [AFM](https://help.gooddata.com/display/bHsp5IhQjuz0e6HS0s76/AFM)
 - [Transformation](https://help.gooddata.com/display/bHsp5IhQjuz0e6HS0s76/Transformation)

## Develop

### Running the development
```sh
$ cd gooddata-data-layer
$ yarn dev
```

### Running the tests
To validate using [tslint](https://palantir.github.io/tslint/), run
```sh
$ yarn validate
```

To start the unit tests, run
```sh
$ yarn test
```

### Deployment
```
git checkout master && git pull upstream master --tags
npm version patch -m "Release v%s"
npm publish --tag alpha
git push upstream master --tags
```

## Contributing
Report bugs and features on our [issues page](https://github.com/gooddata/gooddata-data-layer/issues).

## License
(C) 2007-2018 GoodData Corporation

For more information, please see [LICENSE](https://github.com/gooddata/gooddata-data-layer/blob/master/LICENSE)
