class CharSheet {
  constructor() {

  }

  name: string;
  private _streetSmarts: integer;
  private _glitz: integer;
  private _academic: integer;
  private _cool: integer;
  private _business: integer;
  private _nextDoor: integer;

  get streetSmarts(): integer {
    return this._streetSmarts;
  }
  get glitz(): integer {
    return this._glitz;
  }
  get academic(): integer {
    return this._academic;
  }
  get cool(): integer {
    return this._cool;
  }
  get business(): integer {
    return this._business;
  }
  get nextDoor(): integer {
    return this._nextDoor;
  }

  set streetSmarts(value: integer) {
    this._streetSmarts = value;
  }
  set glitz(value: integer) {
    this._glitz = value;
  }
  set academic(value: integer) {
    this._academic = value;
  }
  set cool(value: integer) {
    this._cool = value;
  }
  set business(value: integer) {
    this._business = value;
  }
  set nextDoor(value: integer) {
    this._nextDoor = value;
  }

}