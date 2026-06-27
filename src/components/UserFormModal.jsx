import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from './Modal';
import Button from './Button';

const schema = yup.object({
  firstname: yup.string().required('First name is required'),
  lastname: yup.string().required('Last name is required'),
  username: yup.string().required('Username is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  street: yup.string().required('Street is required'),
  city: yup.string().required('City is required'),
  zipcode: yup.string().required('Zip code is required'),
});

function toFormValues(user) {
  return {
    firstname: user?.name?.firstname || '',
    lastname: user?.name?.lastname || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    zipcode: user?.address?.zipcode || '',
  };
}

export default function UserFormModal({ isOpen, onClose, onSubmit, initialUser, isSaving }) {
  const isEdit = Boolean(initialUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: toFormValues(initialUser),
  });

  useEffect(() => {
    reset(toFormValues(initialUser));
  }, [initialUser, reset]);

  const submit = (values) => {
    const payload = {
      username: values.username,
      email: values.email,
      phone: values.phone,
      name: { firstname: values.firstname, lastname: values.lastname },
      address: {
        street: values.street,
        city: values.city,
        zipcode: values.zipcode,
        number: initialUser?.address?.number || 1,
        geolocation: initialUser?.address?.geolocation || { lat: '0', long: '0' },
      },
    };
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Add new user'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Add user'}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit(submit)}>
        <div className="form-field">
          <label htmlFor="firstname">First name</label>
          <input id="firstname" {...register('firstname')} />
          {errors.firstname && <span className="form-field-error">{errors.firstname.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="lastname">Last name</label>
          <input id="lastname" {...register('lastname')} />
          {errors.lastname && <span className="form-field-error">{errors.lastname.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input id="username" {...register('username')} />
          {errors.username && <span className="form-field-error">{errors.username.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} />
          {errors.email && <span className="form-field-error">{errors.email.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" {...register('phone')} />
          {errors.phone && <span className="form-field-error">{errors.phone.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="city">City</label>
          <input id="city" {...register('city')} />
          {errors.city && <span className="form-field-error">{errors.city.message}</span>}
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="street">Street</label>
          <input id="street" {...register('street')} />
          {errors.street && <span className="form-field-error">{errors.street.message}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="zipcode">Zip code</label>
          <input id="zipcode" {...register('zipcode')} />
          {errors.zipcode && <span className="form-field-error">{errors.zipcode.message}</span>}
        </div>
      </form>
    </Modal>
  );
}
