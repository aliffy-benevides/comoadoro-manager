import { Router } from "express";

export default interface IController {
  readonly Router: Router;
  readonly Path: string;
}