const { DataTypes }= require('sequelize');
const { sequelize } =require('../config/db');
const User = require('./User');

const Student = sequelize.define('Student',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
     cvName:{                          // ⭐ AJOUTE CETTE LIGNE
        type:DataTypes.STRING,
        allowNull:true
    },
    photoPath:{                       // ⭐ AJOUTE CETTE LIGNE
        type:DataTypes.STRING,
        allowNull:true
    },
    nom:{
        type:DataTypes.STRING,
        allowNull:false
    },
     prenom:{
        type:DataTypes.STRING,
        allowNull:false
    },
     matricule: {                                
    type: DataTypes.STRING,
    allowNull: true
  },
     bio: {                                       
    type: DataTypes.TEXT,
    allowNull: true
  },
   
    filiere:{
         type:DataTypes.STRING,
        allowNull:false
    },
    universite:{
         type:DataTypes.STRING,
        allowNull:false
    },
    niveau:{
      type:DataTypes.ENUM('l1','l2','l3','M1','M2'),
      allowNull:true
    },
    telephone:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:null
    },
    adresse:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:null
    },
    competences:{
        type:DataTypes.ARRAY(DataTypes.STRING),
        defaultValue:[]
    },
    github:{
        type:DataTypes.STRING,
        allowNull:true,
        validate:{
            isUrl:true
        }
    },
    portfolio:{
        type:DataTypes.STRING,
        allowNull:true,
        validate:{
            isUrl:true
        }
    },
    cvPath:{
     type:DataTypes.STRING,
        allowNull:true
    },
    estPlace:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    }
},{
    tableName: 'Students',
    timeStamp:true
});


module.exports = Student;