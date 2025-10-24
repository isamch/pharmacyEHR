// import  from "./../models/";
// import {  } from '../utils/'



export const getAll__NAME__ = (req, res) => {


  res.send("Get all __NAME__");
};



export const get__NAME__ = (req, res) => {


  res.send(`Get single __NAME__ with id ${req.params.id}`);
};



export const create__NAME__ = (req, res) => {

  
  res.send("Create new __NAME__");
};


export const update__NAME__ = (req, res) => {


  res.send(`Update __NAME__ with id ${req.params.id}`);
};



export const delete__NAME__ = (req, res) => {


  res.send(`Delete __NAME__ with id ${req.params.id}`);
};