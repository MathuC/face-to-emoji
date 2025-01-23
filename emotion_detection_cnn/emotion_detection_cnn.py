# import packages
import cv2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, Flatten
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers.schedules import ExponentialDecay
import matplotlib.pyplot as plt

# Initialize image data generator with rescaling from 0-255 to float 0.0-1.0
train_data_gen = ImageDataGenerator(rescale=1./255)
validation_data_gen = ImageDataGenerator(rescale=1./255)

batch_s = 64

# preprocess all train images
validation_generator = validation_data_gen.flow_from_directory(
        'data/test',
        target_size=(48, 48),
        batch_size=batch_s,
        color_mode="grayscale",
        class_mode='categorical')

# preprocess all test images
train_generator = train_data_gen.flow_from_directory(
        'data/train',
        target_size=(48, 48),
        batch_size=batch_s,
        color_mode="grayscale",
        class_mode='categorical')

# create cnn model structure
emotion_model = Sequential()

emotion_model.add(Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(48, 48, 1)))
emotion_model.add(Conv2D(64, kernel_size=(3, 3), activation='relu'))
emotion_model.add(MaxPooling2D(pool_size=(2, 2)))
emotion_model.add(Dropout(0.25))

emotion_model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
emotion_model.add(MaxPooling2D(pool_size=(2, 2)))
emotion_model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
emotion_model.add(MaxPooling2D(pool_size=(2, 2)))
emotion_model.add(Dropout(0.25))

emotion_model.add(Flatten())
emotion_model.add(Dense(1024, activation='relu'))
emotion_model.add(Dropout(0.5))
emotion_model.add(Dense(7, activation='softmax'))

cv2.ocl.setUseOpenCL(False)

# Define the schedule
lr_schedule = ExponentialDecay(
    initial_learning_rate=0.001, # Starting learning rate
    decay_steps=28709 // batch_s, # How often to apply decay (in steps)
    decay_rate=0.90, # The factor by which the learning rate decays
    staircase=False # If True, decay in discrete intervals
)

emotion_model.compile(loss='categorical_crossentropy', optimizer=Adam(learning_rate=lr_schedule),  metrics=['accuracy'])

# train cnn
emotion_model_info = emotion_model.fit(
        train_generator,
        steps_per_epoch=28709 // batch_s,
        epochs=15, 
        validation_data=validation_generator,
        validation_steps=7178 // batch_s)

# json file is not needed since h5 file will be converted using tensorflowjs
'''
model_json = emotion_model.to_json()
with open("emotion_model.json", "w") as json_file:
    json_file.write(model_json)
'''

# save trained model weight in .h5 file
emotion_model.save_weights('emotion_model.h5')

# generate graph of loss and accuracy
# Plot Loss
plt.figure(figsize=(12, 6))
plt.subplot(1, 2, 1)
plt.plot(emotion_model_info.history['loss'], label='Training Loss')
plt.plot(emotion_model_info.history['val_loss'], label='Validation Loss')
plt.title('Loss During Training')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()

# Plot Accuracy
plt.subplot(1, 2, 2)
plt.plot(emotion_model_info.history['accuracy'], label='Training Accuracy')
plt.plot(emotion_model_info.history['val_accuracy'], label='Validation Accuracy')
plt.title('Accuracy During Training')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()

# Display the plots
plt.tight_layout()
plt.savefig('training_history.png')