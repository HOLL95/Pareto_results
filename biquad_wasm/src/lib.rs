use wasm_bindgen::prelude::*;
use biquad::*;
use js_sys::{Float64Array, Array};
use rustfft::{FftPlanner, num_complex::Complex, num_complex::Complex64 };
use std::f64;
use web_sys::console;
use apodize::hanning_iter;
use std::f64::consts::PI;
use itertools::izip;
// Use wasm-bindgen to expose the Rust functions to JavaScript

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

fn decimate_matrix(time: Vec<f64>, data: Vec<Vec<f64>>, factor: usize, sample_rate: f64, cutoff_freq: f64) -> Vec<Vec<f64>> {
    let coeffs = Coefficients::<f64>::from_params(
        Type::LowPass,
        sample_rate.hz(),
        cutoff_freq.hz(),
        Q_BUTTERWORTH_F64
    ).unwrap();
    let decimated_size = (time.len() + factor - 1) / factor;
    let mut result = vec![Vec::with_capacity(decimated_size); data.len() + 1];

    for i in (0..time.len()).step_by(factor) {
        result[0].push(time[i]);
    }

    for (i, row) in data.iter().enumerate() {
        let mut filter = DirectForm1::<f64>::new(coeffs);
        for j in (0..row.len()).step_by(factor) {
            result[i + 1].push(filter.run(row[j]));
        }
    }
    result
}

#[wasm_bindgen]
pub fn decimate_data(time: &Float64Array, current: &Float64Array, potential: &Float64Array, factor: usize, sample_rate: f64, cutoff_freq: f64) -> Result<JsValue, JsValue> {
    let time_vec: Vec<f64> = time.to_vec();
    let current_vec: Vec<f64> = current.to_vec();
    let potential_vec: Vec<f64> = potential.to_vec();

    // Check that all input vectors have the same length
    if time_vec.len() != current_vec.len() || time_vec.len() != potential_vec.len() {
        return Err(JsValue::from_str("Input arrays must have the same length"));
    }

    let data = vec![current_vec, potential_vec];
    let decimated = decimate_matrix(time_vec, data, factor, sample_rate, cutoff_freq);

    let result = Array::new();
    for row in decimated {
        result.push(&Float64Array::from(&row[..]));
    }

    Ok(JsValue::from(result))
}
fn fftfreq(t_len: usize, 
            dt:f64) -> Vec<f64>{
                let mut fft_freqs = vec![0.0; t_len];
                for i in 0..t_len {
                    fft_freqs[i] = if i < t_len / 2 {
                        i as f64 / (t_len as f64 * dt)
                    } else {
                        -(t_len as f64 - i as f64) / (t_len as f64 * dt)
                    };
                }
                fft_freqs
            }
#[wasm_bindgen]
pub fn get_amplitude(
    voltage: Float64Array,
    dt:f64,
    input_freq: f64,
) -> f64{
    let voltage_vec: Vec<f64> = voltage.to_vec();
    let len=voltage_vec.len();
    let fft_freqs=fftfreq(len, dt);
    let window = flattop_window(len);
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);
    
    let mut voltage_windowed: Vec<Complex<f64>> = izip!(&voltage_vec, &window)
        .map(|(&v, &w)| Complex::new(v * w, 0.0))
        .collect();
    
    fft.process(&mut voltage_windowed);
    let freq_idx=fft_freqs.iter()
                    .enumerate()
                    .min_by(|(_, a), (_, b)| {
                        let diff_a = (input_freq - *a).abs();
                        let diff_b = (input_freq - *b).abs();
                        diff_a.partial_cmp(&diff_b).unwrap()
                    })
                    .map(|(index, _)| index)
                    .expect("Failed to find closest frequency index");
    let peak_amplitude=voltage_windowed[freq_idx as usize].norm();
    let sneak_amp = 2.0 * peak_amplitude / window.iter().sum::<f64>();
    sneak_amp

}
#[wasm_bindgen]
pub fn dc_potential(
    time: Float64Array,
    estart:f64,
    ereverse :f64,
    v:f64
) ->  Box<[f64]>{
    let tr=(ereverse-estart)/v;
    let time_vec=time.to_vec();
    let t_len=time_vec.len();
    let mut dcpot=vec![0.0; t_len];
    for i in 0..t_len {
        dcpot[i] = if time_vec[i] < tr  {
            estart+(time_vec[i]*v)
        } else {
            ereverse-v*(time_vec[i]-tr)
        };
    }
    dcpot.into_boxed_slice()
}
#[wasm_bindgen]
pub fn harmonics(
    time: Float64Array,
    current: Float64Array,
    input_freq: f64,
    envelope: bool,
    hanning: bool,
    desired_harmonics: Float64Array,
    filter_pc: f64,
    decimation_factor: usize,
    sample_rate: f64,
) -> Result<JsValue, JsValue> {
    // Convert input arrays to Rust types
    
    let time_vec: Vec<f64> = time.to_vec();
    let current_vec: Vec<f64> = current.to_vec();
    let len = time_vec.len();
    let dt = time_vec[1] - time_vec[0];
    let fft_freqs=fftfreq(len, dt);
    // Calculate FFT frequencies
   
    
    // Apply Hanning window if needed
    let mut windowed_current = current_vec.clone();
    if hanning{
        for (i, window_value) in hanning_iter(len).enumerate() {
            windowed_current[i] *= window_value;
        }
    }
  
    
    // Perform FFT on the current data
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);
    let fft_input: Vec<Complex<f64>> = windowed_current.iter().map(|&x| Complex { re: x, im: 0.0 }).collect();
    let mut fft_output = fft_input.clone();
    fft.process(&mut fft_output);
    let signal_len=fft_output.len();
    // Compute the magnitudes of the FFT output
    let fft_magnitudes: Vec<f64> = fft_output.iter().map(|c| c.norm()).collect();
    // Find the dominant frequency
    let dominant_freq = if input_freq == 0.0 {
        let max_index = fft_magnitudes
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .map(|(i, _)| i)
            .unwrap_or(0);
        fft_freqs[max_index].abs()
    } else {
        input_freq
    };
    
    let desired_harmonics: Vec<f64> = desired_harmonics.to_vec();
    let filter_val = filter_pc / 200.0;
    let window_extent = [-filter_val * dominant_freq, filter_val * dominant_freq];
    let mut fft_array: Vec<Vec<f64>> = vec![vec![0.0; signal_len]; desired_harmonics.len()];
    let fft_factor=1.0/len as f64;

    for (i, &harmonic) in desired_harmonics.iter().enumerate() {


       
        let current_position = harmonic * dominant_freq;
        let mut target_harmonic = vec![Complex64::new(0.0, 0.0); len];

        let (idx, factor) = if envelope {
            (vec![1], 2.0*fft_factor)
        } else {
            (vec![-1, 1], 1.0*fft_factor)
        };

        for &j in &idx {
            let window = [
                j as f64 * current_position + window_extent[0],
                j as f64 * current_position + window_extent[1],
            ];
            let window_min = window[0].min(window[1]);
            let window_max = window[0].max(window[1]);
            let window_loc: Vec<usize> = fft_freqs
                .iter()
                .enumerate()
                .filter(|(_, &freq)| freq > window_min && freq < window_max)
                .map(|(index, _)| index)
                .collect();

            for &loc in &window_loc {
                target_harmonic[loc] = Complex64::new(fft_output[loc].re, fft_output[loc].im);
            }
        }

        // Perform inverse FFT
        let ifft = planner.plan_fft_inverse(signal_len);
        let mut target_harmonic_vec: Vec<Complex<f64>> = target_harmonic.iter()
            .map(|&c| Complex::new(c.re, c.im))
            .collect();
        target_harmonic_vec.resize(signal_len, Complex::new(0.0, 0.0));
        ifft.process(&mut target_harmonic_vec);

        // Scale the result and store in fft_array
        if envelope && desired_harmonics[i]!=0.0{
            fft_array[i] = target_harmonic_vec.iter()
                .map(|&c| factor * c.norm())
                .collect();
        } else {
            fft_array[i] = target_harmonic_vec.iter()
                .map(|&c| factor * c.re)
                .collect();
        }
        
    }

    //CHANGE SO THIS STEP HAPPENS ABOVE
    // Process harmonics based on envelope flag and decimate
    //
   
    let highpass=dominant_freq*(desired_harmonics[desired_harmonics.len()-1]+2.0);
    let processed_harmonics = decimate_matrix(time_vec.clone(),fft_array, decimation_factor, sample_rate, highpass);
    let truncated_idx: Vec<usize> = fft_freqs
        .iter()
        .enumerate()
        .filter(|&(_, &freq)| freq > 0.0 && freq < highpass)
        .map(|(i, _)| i)
        .collect();

    let truncated_freqs: Vec<f64> = truncated_idx
        .iter()
        .map(|&i| fft_freqs[i])
        .collect();

    let truncated_fft: Vec<f64> = truncated_idx
        .iter()
        .map(|&i| fft_magnitudes[i])
        .collect();


    //console::log_1(&processed_harmonics[1][4000].to_string().into());
    //console::log_1(&"Rust".into());
    // Prepare the result
    let result = js_sys::Object::new();

    // Add processed harmonics
    let harmonics_array = js_sys::Array::new();
    for harmonic in processed_harmonics {
        harmonics_array.push(&Float64Array::from(&harmonic[..]).into());
    }
   
    js_sys::Reflect::set(&result, &JsValue::from_str("harmonics"), &harmonics_array.into())?;
    js_sys::Reflect::set(&result, &JsValue::from_str("fftFreqs"), &truncated_freqs.into())?;
    // Add FFT magnitudes
    js_sys::Reflect::set(
        &result,
        &JsValue::from_str("fftMagnitudes"),
        &Float64Array::from(&truncated_fft[..]).into(),
    )?;

    // Add dominant frequency
    js_sys::Reflect::set(
        &result,
        &JsValue::from_str("dominantFrequency"),
        &JsValue::from_f64(dominant_freq),
    )?;
    
    Ok(result.into())
}


fn flattop_window(m: usize) -> Vec<f64> {
    let a = vec![0.21557895, 0.41663158, 0.277263158, 0.083578947, 0.006947368];
    let fac: Vec<f64> = (0..m)
        .map(|i| -PI + (2.0 * PI * i as f64) / (m - 1) as f64)
        .collect();

    let mut w = vec![0.0; m];

    for k in 0..a.len() {
        for (i, &f) in fac.iter().enumerate() {
            w[i] += a[k] * (k as f64 * f).cos();
        }
    }

    w
}
