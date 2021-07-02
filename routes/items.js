/*
Copyright 2021 Square Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import express from 'express';
import JSONBig from 'json-bigint';

import { catalogApi, locationsApi } from '../util/square-client';
import CatalogList from '../models/catalog-list';
import { ordersApi } from '../util/square-client';
import { randomBytes } from 'crypto';

const items = express.Router();

items.get("/categories", async (req, res, next) => {
    // Set to retrieve ITEM and IMAGE CatalogObjects
    const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types
  
    try {
      // Retrieves locations in order to display the store name
      const { result: { locations } } = await locationsApi.listLocations();
      // Get CatalogItem and CatalogImage object
      const response = await catalogApi.searchCatalogItems({
        categoryIds: [
          'OF3VMYYAF25AFVNT26ZTB4PN'
        ]
      });
      console.log(response.result)
      // Returns the catalog and first location ID, since we don't need to
      // print the full locationInfo array
      res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
    } catch (error) {
      next(error);
    }
});

items.get("/mens", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "mens") {
        return item
      }
    })  

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/womens", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "womens") {
        return item
      }
    })  

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/unisex", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "unisex") {
        return item
      }
    })  

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});


items.get("/sweatshirts", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "sweatshirts") {
        return item
      }
    })  

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/accessories", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      console.log(item)
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "acessories") {
        return item
      }
    })
    console.log(categoryNames)

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/clinics", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "clinics") {
        return item
      }
    })

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/pets", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    //gets catelog id based on endpoint
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    let categoryIds = [];
    for(let i = 0; i < objects.length; i++) {
        if(objects[i].type === "ITEM"){
          let id = objects[i].itemData.categoryId;
          if(!categoryIds.includes(id)){
              categoryIds.push(id)
          }
        }
    }
    const categoryData = await catalogApi.batchRetrieveCatalogObjects({
      objectIds: categoryIds.map(item => `${item}`)
    });
    let categoryNames = categoryData.result.objects.filter((item) => {
      if(item.categoryData.name.toLowerCase().replace(/[']/gi, '') === "pets") {
        return item
      }
    })

    // Get CatalogItem and CatalogImage object
    const response = await catalogApi.searchCatalogItems({
      categoryIds: [
        categoryNames[0].id
      ]
    }, types);
    // console.log(response.result)
    // Returns the catalog and first location ID, since we don't need to
    // print the full locationInfo array
    res.json({items: JSONBig.parse(JSONBig.stringify(response.result))});
  } catch (error) {
    next(error);
  }
});

items.get("/images", async (req, res, next) => {
  const types = "ITEM,IMAGE";
  try {
    const response = await catalogApi.listCatalog(undefined, 'IMAGE');
    // console.log(response.result.objects)

    let result = response.result.objects
    
    res.json({items: JSONBig.parse(JSONBig.stringify(result))});
  } catch (error) {
    next(error);
  }
});

items.get("/product/:id", async (req, res, next) => {
  const types = "ITEM,IMAGE";
  const id = req.params.id;
  try {
    const response = await catalogApi.retrieveCatalogObject(id, true);
    // console.log(response.result.objects)

    let result = response.result
    
    res.json({items: JSONBig.parse(JSONBig.stringify(result))});
  } catch (error) {
    next(error);
  }
});

items.post("/product/search/:id/:filterText", async (req, res, next) => {
  const types = "ITEM,IMAGE";
  const id = req.params.id;
  const filterText = req.params.filterText;
  console.log(id)
  console.log(filterText)
  try {
    const response = await catalogApi.searchCatalogItems({
      textFilter: req.params.filterText,
      categoryIds: [id]
    });
    // console.log(response.result.objects)

    let result = response.result
    
    res.json({items: JSONBig.parse(JSONBig.stringify(result))});
  } catch (error) {
    next(error);
  }
});

export default items;