# [Face to Emoji](https://facetoemoji.live/)

Tired of scrolling through endless emojis to find the one that matches your mood? With [Face to Emoji](https://facetoemoji.live/), just show your face, and let our AI instantly 
find the perfect emoji for you. 

This web app does real-time facial emotion recognition using a convolutional neural network (CNN) and maps the output to the corresponding emojis. All of the image processing is done directly in your browser and in real-time, eliminating any privacy concerns.

## Demo
https://github.com/user-attachments/assets/81090d92-beca-4377-a38e-7568299dcb97

# Project Architecture

## Technologies Used
- **Frontend:** HTML, CSS, Javascript. TensorFlow.js to load the convolutional neural network directly in the browser. Plotly.js for the live-updating bar chart.
- **Backend:** Built with Node.js, Express, MongoDB, Socket.IO, TensorFlow. Deployed with DigitalOcean and Nginx. Integrated CI/CD with GitHub Actions.

## Important Components

### Frontend
`public/main.js` contains all of the frontend logic.
  - `run()` is the main async function where all of the other asynchronous operations are written in
    - `loop()` is is ran every 100 milliseconds. It detects the face in the frame of the video feed, crops the image, processes it and then sends it to the emotion detection AI model.
`public/emotion_detection_model` contains the Keras CNN model that has been converted to TensorFlow.js format.

### Backend
`src/app.ts` contains all of the backend logic: Express, connection to the MongoDB database, Socket.io

## Convolutional Neural Network
`emotion_detection_cnn/emotion_detection_cnn.py` contains the original CNN. It was written with the help of the TensorFlow library and trained on the [FER-2013](https://www.kaggle.com/datasets/msambare/fer2013) dataset.

### Structure
#### Layers
- **Input** - Shape: (48, 48, 1): The model expects grayscale images with dimensions 48x48 pixels.
- **Convolutional layers**: These layers are the core building blocks of the CNN. They detect edges and corners and when they are deeper in the CNN, they learn more complex patterns like textures, shapes, and patterns.
- **Pooling layers**: Each MaxPooling layer reduces the spatial dimensions by taking the maximum value over a 2x2 window, reducing computational complexity while retaining important features.
- **Dropout layers**: These layers randomly set a percentage of the neurons to zero during training, helping prevent overfitting.
- **Flatten layer**: This layer is just used to prepare the data for the fully connected (dense) layers by converting the multi-dimensional tensor into a 1D vector.
- **Dense layers**: These layers are a more traditional neural network layers. They learn complex patterns and features from the extracted image features from the previous layers.

#### Activation functions
- **ReLU**: Applied to intermediate layers, it introduces non-linearity and allows the network to model complex patterns. It is used so that the neural network doesn't end up doing basic linear regression.
- **Softmax**: Applied to the final output layer, it converts the raw scores into probabilities that sum to 1, providing the network's prediction for the most likely emotion.

### Training
 - 28709 images were used for training.
 - 7178 images were used for testing.

I initially trained the model for 30 epochs but that caused overfitting: even if the accuracy on the test data was increasing, the loss function output was also increasing which meant that for each correct guess, the model wasn't as sure anymore. I finally trained the data for 15 epochs which gave me the the highest accuracy for the lowest loss function output. The final accuracy was 62.5% and the loss was 1.10. The training for 15 epochs took approximately 2 to 3 hours to complete
##### 30 epochs (discarded because of overfitting)
<img src="https://github.com/user-attachments/assets/d378ceca-1a39-4311-ac1e-42dcee4b710d" width="800">

##### 15 epochs (final model)
<img src="https://github.com/user-attachments/assets/e3888caa-e538-45f1-9e15-30b9bd03f989" width="800">

### Limitations
The model's accuracy is not that high at around 63%. 

This is mainly because the dataset is not big enough and because it is very imbalanced. The happy category has more than 7000 images, while the disgust category has under 500 images! Maybe if all of the categories had more than 7000 images, the accuracy would be a lot higher, since for happiness, the model performs incredibly well.

<img src="https://github.com/user-attachments/assets/4056100d-285c-4826-b0b1-0a148ceea31f" width="800">

The model also often gets confused between emotions that look similar on a face, especially for the categories with the lower amount of images in the dataset. It often gets confused between disgust and anger. It also gets confused between surprise and fear, which is more understandable since those two emotions often overlap.

<img src="https://github.com/user-attachments/assets/c9ad7091-5733-4e21-acb0-5da1fa44cb2e" width="500">
<img src="https://github.com/user-attachments/assets/b112358d-6795-4ec7-9126-6c00cc8d6e0b" width="500">

# Setup

## Development Server
**Prerequisites:** Node.js, npm, MongoDB

## Production Server
**Prerequisites:** Node.js, npm, MongoDB

## Convolutional Neural Network
**Prerequisites:** Python 3

# Contributing
- To inform us about bugs or about enhancements you think the web app can benefit from, [submit a new issue](https://github.com/MathuC/face-to-emoji/issues/new) in the repository.
- To contribute to the code, fork the repository, commit your changes, squash your commits, and then submit a Pull Request.


