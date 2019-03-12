// create config object
const config = {};

// default company config
config.schedule = {
  task : {
    fields : [
      {
        name  : 'name',
        grid  : true,
        type  : 'text',
        label : 'Name',
      },
      {
        name  : 'logo',
        type  : 'image',
        label : 'Logo',
      },
      {
        name  : 'abn',
        grid  : true,
        type  : 'text',
        label : 'ABN',
      },
      {
        name  : 'fax',
        type  : 'phone',
        label : 'Fax',
      },
      {
        name  : 'email',
        grid  : true,
        type  : 'email',
        label : 'Email',
      },
      {
        name  : 'phone',
        grid  : true,
        type  : 'phone',
        label : 'Phone',
      },
      {
        name  : 'address',
        type  : 'address',
        label : 'Address',
      },
    ]
  },
  sheet : {
    fields : [
      {
        name  : 'user',
        grid  : true,
        type  : 'user',
        label : 'User',
      },
    ]
  },
};

// export config
module.exports = config;
