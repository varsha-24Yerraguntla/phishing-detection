import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
import pickle

print("Loading dataset...")
data = pd.read_csv('phishing.csv')
print("Dataset loaded:", data.shape)

X = data.drop(columns=['class'])
y = data['class']

print("Training model...")
gbc = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3)
gbc.fit(X, y)
print("Model trained.")

print("Saving model to model.pkl...")
with open('model.pkl', 'wb') as file:
    pickle.dump(gbc, file)
print("Model saved successfully.")
