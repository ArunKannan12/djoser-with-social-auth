import React from 'react'

const ForgotPassword = () => {
  return (
     
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Forgot Password</h3>
              <form onSubmit="">
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    required
                    value=""
                    onChange=""
                    placeholder="Enter your registered email"
                  />
                </div>

                <div className="d-grid">

                </div>
              </form>

              <div className="mt-3 text-center">
                <a href="/login" className="text-decoration-none">Back to Login</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword