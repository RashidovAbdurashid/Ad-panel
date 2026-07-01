import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from './Modal';
import Button from './Button';

const CATEGORIES = ["men's clothing", "women's clothing", "jewelery", "electronics"];

const schema = yup.object({
  title: yup.string().required('Title is required'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .positive('Price must be greater than 0')
    .required('Price is required'),
  category: yup.string().required('Category is required'),
  description: yup.string().required('Description is required'),
  image: yup.string().url('Must be a valid URL').required('Image URL is required'),
});

function toFormValues(product) {
  return {
    title: product?.title || '',
    price: product?.price || '',
    category: product?.category || CATEGORIES[0],
    description: product?.description || '',
    image: product?.image || '',
  };
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialProduct, isSaving }) {
  const isEdit = Boolean(initialProduct);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: toFormValues(initialProduct) });

  useEffect(() => {
    reset(toFormValues(initialProduct));
  }, [initialProduct, isOpen, reset]);

  const imageUrl = watch('image');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add new product'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form className="form-grid product-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Image preview + URL */}
        <div className="form-field form-field--full product-form-image-row">
          <div className="product-form-preview">
            {imageUrl ? (
              <img src={imageUrl} alt="preview" />
            ) : (
              <span className="product-form-preview-placeholder">No image</span>
            )}
          </div>
          <div className="product-form-image-field">
            <label htmlFor="image">Image URL</label>
            <input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register('image')}
            />
            {errors.image && <span className="form-field-error">{errors.image.message}</span>}
          </div>
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="title">Title</label>
          <input id="title" type="text" placeholder="Product title" {...register('title')} />
          {errors.title && <span className="form-field-error">{errors.title.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="price">Price ($)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('price')}
          />
          {errors.price && <span className="form-field-error">{errors.price.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" {...register('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          {errors.category && <span className="form-field-error">{errors.category.message}</span>}
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            placeholder="Product description…"
            {...register('description')}
          />
          {errors.description && <span className="form-field-error">{errors.description.message}</span>}
        </div>
      </form>
    </Modal>
  );
}
