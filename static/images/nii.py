#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import nibabel as nib
import numpy as np
import argparse
import os

def convert_float_to_int(input_path, output_path=None, dtype=np.int16):
    """
    将浮点型NIfTI文件转换为整型
    
    参数:
        input_path: 输入.nii.gz文件路径
        output_path: 输出文件路径(可选)
        dtype: 目标数据类型(默认为np.int16)
    """
    # 加载NIfTI文件
    img = nib.load(input_path)
    data = img.get_fdata()
    
    # 检查输入数据类型
    if not np.issubdtype(data.dtype, np.floating):
        print(f"警告: 输入数据已经是 {data.dtype} 类型，不是浮点型")
    
    # 转换为整数类型
    int_data = data.astype(dtype)
    
    # 创建新的NIfTI图像对象
    new_img = nib.Nifti1Image(int_data, img.affine, img.header)
    
    # 设置输出路径
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        if ext == '.gz':
            base, _ = os.path.splitext(base)
        output_path = f"{base}_int16.nii.gz"
    
    # 保存文件
    nib.save(new_img, output_path)
    print(f"转换完成: 已保存为 {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='将浮点型NIfTI转换为整型')
    parser.add_argument('-i', '--input', help='输入.nii.gz文件路径')
    parser.add_argument('-o', '--output', help='输出文件路径(可选)')
    parser.add_argument('-t', '--dtype', choices=['int8', 'int16', 'int32', 'uint8', 'uint16'], 
                        default='int8', help='目标数据类型(默认:int16)', required=False)
    
    args = parser.parse_args()
    
    # 映射数据类型字符串到numpy类型
    dtype_map = {
        'int8': np.int8,
        'int16': np.int16,
        'int32': np.int32,
        'uint8': np.uint8,
        'uint16': np.uint16
    }
    
    convert_float_to_int(args.input, args.output, dtype_map[args.dtype])