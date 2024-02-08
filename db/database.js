const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1;`,[email])
    .then(result => {
      return result.rows[0];
    })
    .catch(error => console.error(error));
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1;`,[id])
    .then(result => {
      return result.rows[0];
    })
    .catch(error => console.error(error));
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`
    INSERT 
    INTO users (name, email, password) 
    VALUES($1, $2, $3)
    RETURNING *;`,[user.name, user.email, user.password])
    .then(result => {
      return result.rows[0];
    })
    .catch(error => console.error(error));

};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
      SELECT *
      FROM reservations
      WHERE guest_id = $1
      LIMIT $2;`,[guest_id, limit])
    .then(result => {
      return result.rows;
    })
    .catch(error => console.error(error));
};

/// Properties



/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  let queryParams = [];
  let queryWhere = '';

  // function to build the where clause for ONE PROPERTY
  //   returned through given callback
  const buildNextWhere = function(criteria, comparator, callback) {
    let newWhereCriteria = 'WHERE';
    if (queryParams.length > 1) {
      newWhereCriteria = ' AND';
    };
    newWhereCriteria += ` ${criteria} ${comparator} $${queryParams.length}`;
    callback(newWhereCriteria);
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    buildNextWhere(`city`, 'LIKE',(newWhereCriteria) => {
      queryWhere += newWhereCriteria;
    });
  };

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    buildNextWhere(`owner_id`, '=',(newWhereCriteria) => {
      queryWhere += newWhereCriteria;
    });
  };

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    buildNextWhere(`minimum_price_per_night`, '>=',(newWhereCriteria) => {
      queryWhere += newWhereCriteria;
    });
  };


  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    buildNextWhere(`maximum_price_per_night`, '<=',(newWhereCriteria) => {
      queryWhere += newWhereCriteria;
    });
  };
   
  let queryLimit = '';
  if (Number(limit) > 0) {
    queryParams.push(limit);
    queryLimit = `LIMIT $${queryParams.length}`;
  }
  
  return pool
    .query(`SELECT * FROM properties ${queryWhere} ${queryLimit};`,queryParams)
    .then(result => {
      return result.rows;
    })
    .catch(error => console.error(error));
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
