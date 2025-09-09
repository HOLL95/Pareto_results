import subprocess
import os 
import numpy as np
from scipy.signal import decimate

total_loc=os.getcwd()
files=os.listdir("M4D2/Data/")
lists=[]
for file in files:
    if "FTACV" in file:
        new_path=os.path.join("M4D2/Data", file)
        sub_files=os.listdir(new_path)
        lists.append(file)
        times=np.loadtxt(os.path.join(total_loc, new_path, "times.txt"))
        data=np.loadtxt(os.path.join(total_loc, new_path, "data.txt"))
        np.savetxt(os.path.join(total_loc, new_path, "times.txt"),decimate(times,8))
        np.savetxt(os.path.join(total_loc, new_path, "data.txt"),decimate(data, 8))
    